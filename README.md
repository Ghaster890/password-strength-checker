# Password Strength Checker

A responsive, browser-based tool that gives an educational estimate of password strength and checks whether a password appears in Have I Been Pwned's Pwned Passwords dataset.

- **Live demo:** https://ghaster890.github.io/password-strength-checker/
- **GitHub repository:** https://github.com/Ghaster890/password-strength-checker

## What it does

- Reviews password length and lowercase, uppercase, number, and symbol variety.
- Flags common password families, keyboard walks, repeated characters, simple sequences, and year-like endings.
- Shows a local strength estimate, the signals it found, and practical suggestions for improvement.
- Checks breach prevalence through the Have I Been Pwned Pwned Passwords range API.
- Includes show/hide and clear controls, responsive styling, and accessible status and result labels.

## How the strength estimate works

The app calculates an **0–8 educational score** in the browser. It awards up to four points for length (with more points for longer passwords), then one point for each of four character types: lowercase letters, uppercase letters, numbers, and symbols. It subtracts points for detected predictable patterns and clamps the result to the 0–8 range.

The displayed grades are **Needs work** (0–2), **Fair** (3–4), **Strong** (5–6), and **Very strong** (7–8). This is a transparent heuristic, not a cryptographic strength measurement or security certification.

## How the breach lookup works

1. The browser encodes the entered password and calculates its SHA-1 hash locally.
2. It sends only the first five hexadecimal characters of that hash to the Pwned Passwords range endpoint.
3. Have I Been Pwned returns hashes with that prefix; the browser compares the remaining hash characters locally and displays the breach count if there is a match.

The request uses the API's `Add-Padding` header and disables caching. The full password and full hash are not sent to the service, stored by this app, or sent to an app backend. The five-character prefix is still disclosed to Have I Been Pwned, so this reduces exposure but does not make the lookup zero-information-leakage. SHA-1 is used only to match this API's dataset; it is not used to store or protect passwords.

## Run locally

The browser's Web Crypto API requires a secure context. Use HTTPS or localhost. From the project folder, start a local server:

```powershell
py -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). If `py` is unavailable, try `python -m http.server 8000`.

## Deploy with GitHub Pages

This is a static site and needs no build step, environment variables, or server-side secrets.

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and the `/(root)` folder, then save.
4. GitHub Pages publishes the site at the live demo URL above.

## Important limits

- A “no match” result only means the password was not present in the breach data returned by the service; it cannot prove that the password has never been exposed.
- Strength feedback uses simple, explainable heuristics. It can miss patterns or flag an unusual but valid password.
- The app checks passwords only. It does not check email accounts, login forms, or private breach databases.
- The breach check needs a network connection. If it fails, the local strength feedback remains available.

## Technology

Vanilla JavaScript, HTML, CSS, regular expressions, the Web Crypto API, and the Have I Been Pwned Pwned Passwords range API.

## References

- [Have I Been Pwned API — Pwned Passwords](https://haveibeenpwned.com/API/V3#PwnedPasswords)
- [GitHub Pages quickstart](https://docs.github.com/en/pages/quickstart)

## Resume summary

Built a browser-based password strength checker using JavaScript pattern heuristics and the Have I Been Pwned Pwned Passwords range API. Implemented client-side hashing and a k-anonymity range lookup so the full password is never sent to a server.

