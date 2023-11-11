import math

INFINITY = 1000000
DEMO_TARGET = [["up", 2000*i] for i in range(10)]

def record_distance(sr, tr, offset):
    return sr[1] - offset - tr[1]


def score_with_offset_sqrt(sample, target, offset):
    si = 0
    score = 0
    smax = len(sample)
    for tr in target:
        while si < smax and record_distance(sample[si], tr, offset) < 0:
            si += 1
        left = INFINITY if si == 0 else -record_distance(sample[si-1], tr, offset)
        right = INFINITY if si == smax else record_distance(sample[si], tr, offset)
        best = min(left, right)
        score += math.sqrt(max(500-best, 0))
    return int(math.floor(score * 44 / len(target)))


def score_with_offset_sqr(sample, target, offset):
    si = 0
    score = 0
    smax = len(sample)
    for tr in target:
        while si < smax and record_distance(sample[si], tr, offset) < 0:
            si += 1
        left = INFINITY if si == 0 else -record_distance(sample[si-1], tr, offset)
        right = INFINITY if si == smax else record_distance(sample[si], tr, offset)
        best = min(left, right)
        score += max(500-best, 0)**2
    return int(math.floor(score / 250 / len(target)))


def find_best_score(sample, target):
    best_score = -1
    best_offset = 0
    for offset in range(-10000, 10010, 10):
        score = score_with_offset_sqrt(sample, target, offset)
        if score > best_score:
            best_score = score
            best_offset = offset

    sqr_score = score_with_offset_sqr(sample, target, best_offset)
    final_score = int(math.floor(sqr_score * min(len(target)*1.0 / len(sample), 1)))
    print(f"Matching score: {best_score}\nMatching offset: {best_offset}\nSqr score: {sqr_score}\nFinal: {final_score}")
    return final_score
