"""Product telemetry is switched off in this build.

`capture` keeps the call sites of the upstream code working but never sends
anything; the daily feature-state snapshot is no longer scheduled.
"""


def capture(*args, **kwargs) -> None:
	"""No-op stand-in for the framework's usage-data call."""
	return None
