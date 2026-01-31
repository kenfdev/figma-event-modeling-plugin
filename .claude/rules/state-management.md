When saving original state before modifying it, only save if not already saved. Never overwrite a previously saved original value.

After restoring saved state from plugin data, delete the saved keys to prevent stale data on subsequent operations.
