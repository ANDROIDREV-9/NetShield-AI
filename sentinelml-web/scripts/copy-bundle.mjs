// Copies the single-file build into streamlit_bundle/ (not "dist/", which the repo .gitignore excludes).
import { copyFileSync, mkdirSync } from 'node:fs'
mkdirSync('streamlit_bundle', { recursive: true })
copyFileSync('dist-streamlit/index.html', 'streamlit_bundle/index.html')
console.log('Copied dist-streamlit/index.html -> streamlit_bundle/index.html')
