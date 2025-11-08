# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]: "?? Secure Paste"
      - generic [ref=e5]:
        - generic [ref=e6]: "?"
        - generic [ref=e7]: Decryption failed
    - generic [ref=e8]:
      - generic [ref=e9]: Decryption failed. The content may be corrupted or the key may be incorrect.
      - generic [ref=e10]:
        - button "?? Copy to Clipboard" [ref=e11] [cursor=pointer]:
          - generic [ref=e12]: "??"
          - generic [ref=e13]: Copy to Clipboard
        - button "? Create New Paste" [ref=e14] [cursor=pointer]:
          - generic [ref=e15]: "?"
          - generic [ref=e16]: Create New Paste
    - generic [ref=e17]:
      - paragraph [ref=e18]:
        - link "? New Paste" [ref=e19] [cursor=pointer]:
          - /url: index.html
        - link "?? BB Chat" [ref=e20] [cursor=pointer]:
          - /url: chat.html
      - paragraph [ref=e21]: This paste was encrypted in the sender's browser. Zero-knowledge security.
  - link "v0.1.4-alpha" [ref=e22] [cursor=pointer]:
    - /url: https://github.com/SnarkyB/delerium-paste
```