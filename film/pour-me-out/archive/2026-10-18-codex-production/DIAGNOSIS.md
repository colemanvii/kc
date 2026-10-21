# Little KC source diagnosis

18 October 2026. Read-only inspection of six local candidate files. These are web derivatives with unverified authorship, not proven original Jim masters.

## Exact files and formats

| File | Detected encoding / header dimensions | Actual bytes | Declared complete size | Missing bytes |
|---|---|---:|---:|---:|
| `personal/assets/kashus-character.webp` | RIFF WebP, lossy VP8, 567 × 700 | 7,506 | 24,122 | 16,616 |
| `mobile-refinement/assets/kashus-character.webp` | RIFF WebP, lossy VP8, 567 × 700 | 7,506 | 24,122 | 16,616 |
| `photos-study/assets/kashus-character.webp` | RIFF WebP, lossy VP8, 567 × 700 | 7,506 | 24,122 | 16,616 |
| `personal/assets/kashus-after.webp` | RIFF WebP, lossy VP8, 570 × 570 | 7,506 | 32,234 | 24,728 |
| `mobile-refinement/assets/kashus-after.webp` | RIFF WebP, lossy VP8, 570 × 570 | 7,506 | 32,234 | 24,728 |
| `photos-study/assets/kashus-after.webp` | RIFF WebP, lossy VP8, 570 × 570 | 7,506 | 32,234 | 24,728 |

Dimensions describe the encoded headers, not successfully decoded pixels. All character copies have identical hashes; all after-cover copies have another identical hash. Neither group contains a complete alternate copy. No approved Ryman/Gemini environment package was located in the local filename inventory.

## Exact decoder errors

- Pillow/libwebp, all six files, rerun in this task: `OSError: could not create decoder object`.
- Image viewer, `personal/assets/kashus-character.webp`, baseline attempt: `unable to process image: invalid or unsupported image data`.
- macOS `sips`, same character file, baseline attempt: `Error: Cannot extract image from file.` followed by `Error 13: an unknown error occurred` (exit 13).

## Structural evidence and conclusion

For each character file, the RIFF header declares 24,114 bytes after the first eight bytes, meaning 24,122 total. The VP8 chunk at offset 12 declares 24,102 payload bytes, but only 7,486 are present. For each after-cover file, RIFF declares 32,234 total and VP8 declares 32,214 payload bytes, with only 7,486 present.

The files are structurally incomplete/truncated. This is not evidence of a wrong extension or merely an unsupported valid WebP variant. All six ending at exactly 7,506 bytes suggests a shared transfer/storage truncation, but the responsible process cannot be determined from these files alone.

Changing an extension, editing the length header, or converting the file cannot restore the missing compressed bytes. No such repair, redraw, reconstruction or screenshot extraction was attempted. The correct remedy is a fresh complete transfer from the original source, ideally Jim’s layered master plus a lossless transparent PNG of the approved reveal pose. Verify the replacement’s hash against the source and decode it fully before use.

Full headers, chunk lengths, hashes and per-file decoder results: `artwork-diagnostics.json`.
