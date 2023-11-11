from django.db import models
import uuid


class Game(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)

    def __str__(self):
        return f'{self.title} ({self.id})'


class Player(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, editable=False)
    session_id = models.UUIDField(editable=False)
    name = models.CharField(max_length=127, blank=True, null=True)
    top_score = models.IntegerField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=('game', 'session_id'), name='one_session_per_game')
        ]