"""
URL configuration for huhahei project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import uuid

from django.contrib import admin
from django.urls import path
from django.views.generic.base import RedirectView
from django.shortcuts import redirect

from mainapp import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('games/<uuid:game_id>/board/', views.leaderboard, name='board'),
    path('games/<uuid:game_id>/play/', views.play, name='play'),
    path('games/<uuid:game_id>/update-name/', views.update_name, name='update-name'),
    path('games/<uuid:game_id>/submit/', views.submit, name='submit'),

    # Convenience redirect
    # Depends on junction-fixture.json
    path('', lambda r : redirect('play', permanent=False, game_id=uuid.UUID('44f5c1d5-81a6-436e-9b52-1d0f160877c4'))),
]
