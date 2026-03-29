# Locale JSON (`en.json` / `ar.json`)

**Duplicate keys:** JSON does not allow duplicate keys in the same object. Many parsers accept duplicates but **silently keep the last value**, so earlier entries disappear without a clear error. Avoid repeating the same property name; **merge nested objects** under one key instead of listing the same key twice.

**Canonical copy:** Treat **`en.json` as the full, canonical** set of strings. **`ar.json` can be partial**—at runtime, `t()` resolves missing or non-string (e.g. nested object) values in the active language by **falling back to English** before returning the raw key.
