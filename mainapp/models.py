from django.db import models
import uuid


class Game(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    capture_time_ms = models.IntegerField()
    target_pattern = models.JSONField()

    def __str__(self):
        return f'{self.title} ({self.id})'


class Player(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, editable=False)
    session_id = models.UUIDField(editable=False)
    name = models.CharField(max_length=127, blank=True, null=True)
    top_score = models.IntegerField(blank=True, null=True)
    top_score_at = models.DateTimeField(blank=True, null=True)

    def display_name(self):
        return self.name or "Anonymous"

    def __str__(self):
        return f'{self.display_name()} @ {self.game.title} ({self.id})'

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=('game', 'session_id'), name='one_session_per_game')
        ]


class Submit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    player = models.ForeignKey(Player, on_delete=models.CASCADE, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField()
    pattern = models.JSONField()
