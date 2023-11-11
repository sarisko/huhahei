import functools
import random
import uuid

from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.utils import timezone

from . import models
from . import forms
from . import algorithm


def leaderboard(request, game_id):
    game = get_object_or_404(models.Game, id=game_id)

    players = models.Player.objects.filter(game=game).exclude(top_score__isnull=True).order_by('-top_score', 'top_score_at')[:100]

    records_with_ranks = [{
        'name': p.display_name(),
        'score': p.top_score,
        'time': p.top_score_at,
        'rank': i+1,
    } for i, p in enumerate(players)]

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

        response = func(request, game=game, player=player, *args, **kwargs)

        if session_id_raw is None:
            response.set_cookie(cookie_name, session_id)

        return response

    return wrapped


@_manage_player
def play(request, game, player):
    name_form = forms.NameForm(data={'name': player.name})
    submit_form = forms.SubmitForm()
    return render(request, "huhahei/play.html", {
        'game': game,
        'player': player,
        'name_form': name_form,
        'submit_form': submit_form,
    })


@_manage_player
def update_name(request, game, player):
    name_form = forms.NameForm(request.POST)
    if not name_form.is_valid():
        return HttpResponseBadRequest()

    player.name = name_form.cleaned_data['name']
    player.save()
    return render(request, 'huhahei/play_msgs.html', {
        'msgs': [
            {
                'text': f'Your name has been updated to "{player.name}"'
            }
        ],
        'player_name': player.name
    })


@_manage_player
def submit(request, game, player):
    submit_form = forms.SubmitForm(request.POST)
    if not submit_form.is_valid():
        return HttpResponseBadRequest()

    messages = []

    print(submit_form.cleaned_data['data'])

    # simulate score
    # score = sum([random.randint(0, 100) for _ in range(10)])
    score = algorithm.find_best_score(submit_form.cleaned_data['data'], game.target_pattern)

    messages.append({'text': f'Your score is {score}'})

    if score > (player.top_score or 0):
        player.top_score = score
        player.top_score_at = timezone.now()
        player.save()
        messages.append({'text': f'Congratulations! This is your new best score.'})

    return render(request, 'huhahei/play_msgs.html', {
        'msgs': reversed(messages),
        'top_score': player.top_score
    })