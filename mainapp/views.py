import functools
import uuid

from django.shortcuts import render
from django.shortcuts import get_object_or_404

from . import models


def leaderboard(request, game_id):
    game = get_object_or_404(models.Game, id=game_id)

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

    return render(request, "huhahei/board.html", {
        'records': records_with_ranks,
        'game': game,
    })


def _manage_player(func):
    cookie_name = 'huhahei_session'

    @functools.wraps(func)
    def wrapped(request, game_id, *args, **kwargs):
        session_id_raw = request.COOKIES.get(cookie_name)
        session_id = uuid.uuid4() if session_id_raw is None else uuid.UUID(session_id_raw)
        game = get_object_or_404(models.Game, id=game_id)
        player, _ = models.Player.objects.get_or_create(game=game, session_id=session_id)
        print(player)

        response = func(request, game=game, player=player, *args, **kwargs)

        if session_id_raw is None:
            response.set_cookie(cookie_name, session_id)

        return response

    return wrapped


@_manage_player
def play(request, game, player):
    return render(request, "huhahei/play.html", {
        'game': game,
        'player': player,
    })