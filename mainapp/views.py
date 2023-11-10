from django.shortcuts import render


# Create your views here.
def leaderboard(request):
    dummy_scores = [
        {'name': 'Syseľ', 'score': 1234},
        {'name': 'Sára', 'score': 1233},
        {'name': 'Tomáš', 'score': 47},
        {'name': 'Zajo', 'score': 42},
        {'name': 'Pankrác', 'score': 3},
        {'name': 'Servác', 'score': 2},
        {'name': 'Bonifác', 'score': 1},
    ]

    records_with_ranks = [{**r, 'rank': i+1} for i, r in enumerate(dummy_scores)]

    return render(request, "huhahei/board.html", {'records': records_with_ranks})