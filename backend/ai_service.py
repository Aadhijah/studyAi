from flask import Flask, request, jsonify
import re
import math
import string
import json
from collections import Counter, defaultdict

app = Flask(__name__)

# ─── TEXT UTILITIES ─────────────────────────────────────────────────────────

STOP_WORDS = set("""
a about above after again against all also am an and any are aren't as at be
because been before being below between both but by can can't cannot could
couldn't did didn't do does doesn't doing don't down during each few for from
further get got had hadn't has hasn't have haven't having he he'd he'll he's
her here here's hers herself him himself his how how's i i'd i'll i'm i've if
in into is isn't it it's its itself let's me more most mustn't my myself no nor
not of off on once only or other ought our ours ourselves out over own same
shan't she she'd she'll she's should shouldn't so some such than that that's
the their theirs them themselves then there there's these they they'd they'll
they're they've this those through to too under until up very was wasn't we
we'd we'll we're we've were weren't what what's when when's where where's which
while who who's whom why why's will with won't would wouldn't you you'd you'll
you're you've your yours yourself yourselves also however therefore thus hence
moreover furthermore although though even also well just like may might also
""".split())


def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    return text.strip()


def split_sentences(text):
    text = re.sub(r'\s+', ' ', text)
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
    sentences = []
    for p in parts:
        p = p.strip()
        if len(p.split()) >= 5:
            sentences.append(p)
    return sentences


def tokenize(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return [w for w in text.split() if w and w not in STOP_WORDS and len(w) > 2]


def compute_tfidf(sentences):
    tf_per_sentence = []
    for sent in sentences:
        words = tokenize(sent)
        tf = Counter(words)
        total = len(words) or 1
        tf_per_sentence.append({w: c / total for w, c in tf.items()})

    doc_freq = Counter()
    for tf in tf_per_sentence:
        for w in tf:
            doc_freq[w] += 1

    n = len(sentences) or 1
    idf = {w: math.log(n / (df + 1)) + 1 for w, df in doc_freq.items()}

    scores = []
    for tf in tf_per_sentence:
        score = sum(tf_val * idf.get(w, 1) for w, tf_val in tf.items())
        scores.append(score)
    return scores, idf


def score_sentences(sentences):
    if not sentences:
        return []
    scores, _ = compute_tfidf(sentences)
    return scores


def top_sentences(sentences, n):
    if not sentences:
        return []
    scored = list(enumerate(score_sentences(sentences)))
    scored.sort(key=lambda x: x[1], reverse=True)
    top_idx = sorted([i for i, _ in scored[:n]])
    return [sentences[i] for i in top_idx]


def extract_keywords(text, n=20):
    words = tokenize(text)
    freq = Counter(words)
    total = len(words) or 1
    sentences = split_sentences(text)
    doc_freq = Counter()
    for sent in sentences:
        for w in set(tokenize(sent)):
            doc_freq[w] += 1
    n_docs = len(sentences) or 1
    tfidf = {w: (c / total) * math.log(n_docs / (doc_freq.get(w, 1) + 1) + 1)
             for w, c in freq.items()}
    return [w for w, _ in sorted(tfidf.items(), key=lambda x: x[1], reverse=True)[:n]]


def extract_key_phrases(text, n=15):
    sentences = split_sentences(text)
    phrase_scores = defaultdict(float)
    for sent in sentences:
        words = tokenize(sent)
        for size in (2, 3):
            for i in range(len(words) - size + 1):
                phrase = ' '.join(words[i:i + size])
                phrase_scores[phrase] += 1.0 / size
    top = sorted(phrase_scores.items(), key=lambda x: x[1], reverse=True)
    seen_words = set()
    result = []
    for phrase, _ in top:
        words = phrase.split()
        if not any(w in seen_words for w in words):
            result.append(phrase)
            seen_words.update(words)
            if len(result) >= n:
                break
    return result


def infer_tags(text, n=8):
    kw = extract_keywords(text, 30)
    return kw[:n]


# ─── NOTES ENDPOINT ──────────────────────────────────────────────────────────

@app.route('/notes', methods=['POST'])
def generate_notes():
    data = request.json or {}
    text = clean_text(data.get('text', ''))
    title = data.get('title', 'Notes')

    if len(text.strip()) < 50:
        return jsonify({'error': 'Text too short'}), 400

    sentences = split_sentences(text)
    n_summary = min(5, max(2, len(sentences) // 8))
    n_detailed = min(15, max(5, len(sentences) // 3))

    summary_sents = top_sentences(sentences, n_summary)
    detailed_sents = top_sentences(sentences, n_detailed)
    keywords = extract_keywords(text, 25)
    key_phrases = extract_key_phrases(text, 10)
    tags = infer_tags(text, 8)

    summary = ' '.join(summary_sents)

    key_points = []
    for kp in key_phrases[:8]:
        for sent in sentences:
            if kp in sent.lower() and sent not in summary_sents:
                short = sent[:120] + ('…' if len(sent) > 120 else '')
                if short not in key_points:
                    key_points.append(short)
                    break
    if len(key_points) < 5:
        for sent in detailed_sents:
            if sent not in summary_sents:
                short = sent[:120] + ('…' if len(sent) > 120 else '')
                if short not in key_points:
                    key_points.append(short)
                    if len(key_points) >= 8:
                        break

    sections = {}
    for sent in detailed_sents:
        first_word = tokenize(sent)[0] if tokenize(sent) else 'general'
        section = None
        for kp in key_phrases[:6]:
            if kp.split()[0] in sent.lower():
                section = kp.title()
                break
        if not section:
            section = 'Key Concepts'
        sections.setdefault(section, []).append(sent)

    detailed_md = f'# {title}\n\n'
    detailed_md += f'## Overview\n{summary}\n\n'
    for section, sents in list(sections.items())[:6]:
        detailed_md += f'## {section}\n'
        for s in sents[:3]:
            detailed_md += f'- {s}\n'
        detailed_md += '\n'
    if keywords:
        detailed_md += f'## Key Terms\n'
        detailed_md += ', '.join(keywords[:15]) + '\n'

    return jsonify({
        'summary': summary,
        'keyPoints': key_points[:8],
        'detailedNotes': detailed_md,
        'tags': tags,
    })


# ─── QUIZ ENDPOINT ───────────────────────────────────────────────────────────

def build_distractors(correct_word, all_keywords, n=3):
    distractors = [w for w in all_keywords if w != correct_word.lower()]
    result = []
    seen = set()
    for d in distractors:
        if d not in seen and d.lower() != correct_word.lower():
            result.append(d.capitalize())
            seen.add(d)
            if len(result) >= n:
                break
    while len(result) < n:
        result.append('None of the above')
    return result[:n]


def make_question_from_sentence(sent, all_keywords):
    words = sent.split()
    candidates = []
    for i, w in enumerate(words):
        clean = w.strip(string.punctuation).lower()
        if clean in all_keywords and len(clean) > 3 and clean not in STOP_WORDS:
            candidates.append((i, w, clean))
    if not candidates:
        return None
    candidates.sort(key=lambda x: all_keywords.index(x[2]) if x[2] in all_keywords else 999)
    idx, original, keyword = candidates[0]
    blanked = words.copy()
    blanked[idx] = '_____'
    question_text = 'Fill in the blank: ' + ' '.join(blanked)
    correct = original.strip(string.punctuation).capitalize()
    distractors = build_distractors(keyword, all_keywords)
    options = [correct] + distractors
    import random; random.shuffle(options)
    correct_idx = options.index(correct)
    return {
        'question': question_text,
        'options': options,
        'correctAnswer': correct_idx,
        'explanation': f'The correct word is "{correct}". Original: {sent[:100]}',
    }


@app.route('/quiz', methods=['POST'])
def generate_quiz():
    import random
    data = request.json or {}
    text = clean_text(data.get('text', ''))
    num = int(data.get('numQuestions', 10))
    num = min(max(num, 3), 20)

    if len(text.strip()) < 50:
        return jsonify({'error': 'Text too short'}), 400

    sentences = split_sentences(text)
    all_keywords = extract_keywords(text, 50)
    scores = score_sentences(sentences)
    scored = sorted(zip(scores, sentences), key=lambda x: x[0], reverse=True)
    top_sents = [s for _, s in scored[:num * 3]]

    questions = []
    seen = set()
    for sent in top_sents:
        if len(questions) >= num:
            break
        if sent in seen:
            continue
        seen.add(sent)
        q = make_question_from_sentence(sent, all_keywords)
        if q and q['question'] not in [x['question'] for x in questions]:
            questions.append(q)

    if len(questions) < num:
        key_phrases = extract_key_phrases(text, 30)
        for kp in key_phrases:
            if len(questions) >= num:
                break
            for sent in sentences:
                if kp in sent.lower() and sent not in seen:
                    seen.add(sent)
                    q = make_question_from_sentence(sent, all_keywords)
                    if q:
                        questions.append(q)
                        break

    random.shuffle(questions)
    return jsonify({'questions': questions[:num]})


# ─── MIND MAP ENDPOINT ───────────────────────────────────────────────────────

def group_phrases_into_branches(phrases, keywords, max_branches=6):
    if not phrases:
        return []
    branches = []
    used = set()
    anchor_words = [kw for kw in keywords[:max_branches] if len(kw) > 3]
    colors = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed']

    for b_idx, anchor in enumerate(anchor_words[:max_branches]):
        branch_label = anchor.title()
        children = []
        child_idx = 0
        for phrase in phrases:
            if phrase in used:
                continue
            phrase_words = set(phrase.split())
            anchor_words_set = set(anchor.split())
            if phrase_words & anchor_words_set or anchor.split()[0] in phrase:
                used.add(phrase)
                child_idx += 1
                children.append({
                    'id': f'b{b_idx}_c{child_idx}',
                    'label': phrase.title(),
                    'level': 2,
                    'color': colors[b_idx % len(colors)] + 'bb',
                    'children': [],
                })
        for phrase in phrases:
            if phrase in used:
                continue
            if b_idx * 3 < len(phrases) and phrase == phrases[b_idx * 3 % len(phrases)]:
                used.add(phrase)
                child_idx += 1
                children.append({
                    'id': f'b{b_idx}_c{child_idx}',
                    'label': phrase.title(),
                    'level': 2,
                    'color': colors[b_idx % len(colors)] + 'bb',
                    'children': [],
                })
                break
        if children or anchor:
            branches.append({
                'id': f'branch_{b_idx}',
                'label': branch_label,
                'level': 1,
                'color': colors[b_idx % len(colors)],
                'children': children[:4],
            })

    unused_phrases = [p for p in phrases if p not in used]
    if unused_phrases and len(branches) < max_branches:
        extra_children = []
        for i, phrase in enumerate(unused_phrases[:4]):
            extra_children.append({
                'id': f'extra_{i}',
                'label': phrase.title(),
                'level': 2,
                'color': colors[len(branches) % len(colors)] + 'bb',
                'children': [],
            })
        if extra_children:
            branches.append({
                'id': 'branch_other',
                'label': 'Other Topics',
                'level': 1,
                'color': colors[len(branches) % len(colors)],
                'children': extra_children,
            })

    return branches


@app.route('/mindmap', methods=['POST'])
def generate_mindmap():
    data = request.json or {}
    text = clean_text(data.get('text', ''))
    title = data.get('title', 'Mind Map')

    if len(text.strip()) < 50:
        return jsonify({'error': 'Text too short'}), 400

    keywords = extract_keywords(text, 30)
    phrases = extract_key_phrases(text, 24)
    branches = group_phrases_into_branches(phrases, keywords, max_branches=6)

    root_node = {
        'id': 'root',
        'label': title,
        'level': 0,
        'color': '#4f46e5',
        'children': branches,
    }

    return jsonify({'rootNode': root_node})


# ─── HEALTH ──────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(port=5001, debug=False)
