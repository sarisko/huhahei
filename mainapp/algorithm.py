import math

INFINITY = 1000000
DEMO_TARGET = [["up", 2000*i] for i in range(10)]

def record_distance(sr, tr, offset):
    return sr[1] - offset - tr[1]


def score_with_offset(sample, target, offset):
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


def find_best_score(sample, target):
    best_score = -1
    best_offset = 0
    for offset in range(-10000, 10010, 10):
        score = score_with_offset(sample, target, offset)
        if score > best_score:
            best_score = score
            best_offset = offset
    print(f"Score: {best_score}, Used offset: {best_offset}")
    return best_score


