
import numpy as np
from gsm import GameOver, GamePhase, GameActions, GameObject
from gsm import tset, tdict, tlist
from gsm import SwitchPhase, PhaseComplete

class ExamplePhase(GamePhase):
	def __init__(self, **other):
		super().__init__(**other)

	

