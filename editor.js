class Editor {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.titleEl = document.getElementById('docTitle');
    this.authorEl = document.getElementById('docAuthor');
    this.status = document.getElementById('savedAt');
    this.autosaveKey = 'wp_ce_draft_v1';

    this.savedRange = null;
    if (!this.root) {
      console.error(`Editor root not found: ${rootId}`);
      return;
    }

    this._init();
  }

  _init() {
    this._bindToolbar();
    this._restore();
    this._setupAutoSave();
    this._setupTheme();
    this._setupImageEditing();
  }

  _saveSelectionIfInsideEditor() {
    try {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);

      if (this.root.contains(range.commonAncestorContainer) || range.commonAncestorContainer === this.root) {
        this.savedRange = range.cloneRange();
      }
    } catch (e) {
      console.warn('saveSelection failed', e);
    }
  }

  _restoreSelection() {
    try {
      if (!this.savedRange) return;
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(this.savedRange);
    } catch (e) {
      console.warn('restoreSelection failed', e);
    }
  }

  _wrapSelectionWithStyle(styleObj) {
    try {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);

      if (range.collapsed) {
        const span = document.createElement('span');
        Object.assign(span.style, styleObj);
        span.appendChild(document.createTextNode('\u200B')); 
        range.insertNode(span);
     
        const newRange = document.createRange();
      newRange.setStart(span, 0); 
           newRange.setEnd(span, 0);
        sel.removeAllRanges();
        sel.addRange(newRange);

        this.savedRange = newRange.cloneRange();
        return;
      }
      const contents = range.extractContents();
      const span = document.createElement('span');
      Object.assign(span.style, styleObj);
      span.appendChild(contents);
      range.insertNode(span);


      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
      this.savedRange = newRange.cloneRange();
    } catch (e) {
      console.warn('wrapSelectionWithStyle failed', e);
    }
  }

  _bindToolbar() {

    document.addEventListener('selectionchange', () => this._saveSelectionIfInsideEditor());

    document.querySelectorAll('[data-cmd]').forEach(btn => {

      btn.addEventListener('mousedown', (ev) => ev.preventDefault());

      btn.addEventListener('click', (ev) => {

        this._restoreSelection();
        this.root.focus();
        const cmd = btn.getAttribute('data-cmd');
        try {
          document.execCommand(cmd, false, null);
        } catch (e) {
          console.warn('execCommand failed for', cmd, e);
        }
        this._save();
      });
    });


    const fontFamilyEl = document.getElementById('fontFamily');
    if (fontFamilyEl) {
      fontFamilyEl.addEventListener('change', (e) => {
        this._restoreSelection();
        this.root.focus();
        try {
          document.execCommand('fontName', false, e.target.value);
        } catch (err) {

          this._wrapSelectionWithStyle({ fontFamily: e.target.value });
        }
        this._save();
      });
    }


    const fontSizeMap = { '3': '12px','6': '14px', '9': '24px', '12': '32px'};
    const fontSizeEl = document.getElementById('fontSize');
if (fontSizeEl) {
  fontSizeEl.addEventListener('change', (e) => {
    this._restoreSelection();
    this.root.focus();
    const val = e.target.value;

    if (fontSizeMap[val]) {

      this._wrapSelectionWithStyle({ fontSize: fontSizeMap[val] });
      this._save();
    } else if (/^\d+(px|pt|em|rem)$/.test(val)) {

      this._wrapSelectionWithStyle({ fontSize: val });
      this._save();
    } else if (/^\d+$/.test(val)) {

      this._wrapSelectionWithStyle({ fontSize: val + 'px' });
      this._save();
    }
  });
}

    const formatBlockEl = document.getElementById('formatBlock');
    if (formatBlockEl) {
      formatBlockEl.addEventListener('change', (e) => {
        this._restoreSelection();
        this.root.focus();
        const val = e.target.value;
        try {
          document.execCommand('formatBlock', false, `<${val}>`);
        } catch (err) {
          this._wrapSelectionWithStyle({});
        }
        this._save();
      });
    }

    const foreColorEl = document.getElementById('foreColor');
    if (foreColorEl) {
      foreColorEl.addEventListener('input', (e) => {
        this._restoreSelection();
        this.root.focus();
        try {
          document.execCommand('foreColor', false, e.target.value);
        } catch (err) {
          this._wrapSelectionWithStyle({ color: e.target.value });
        }
        this._save();
      });
    }

    const hiliteColorEl = document.getElementById('hiliteColor');
    if (hiliteColorEl) {
      hiliteColorEl.addEventListener('input', (e) => {
        this._restoreSelection();
        this.root.focus();

        try {
          if (!document.execCommand('backColor', false, e.target.value)) {
            document.execCommand('hiliteColor', false, e.target.value);
          }
        } catch (err) {
          this._wrapSelectionWithStyle({ backgroundColor: e.target.value });
        }
        this._save();
      });
    }


    const createLinkBtn = document.getElementById('createLink');
    if (createLinkBtn) {
      createLinkBtn.addEventListener('click', () => {
        const url = prompt('Enter URL (include http:// or https://):', 'https://');
        if (!url) return;
        this._restoreSelection();
        this.root.focus();
        try {
          document.execCommand('createLink', false, url);
        } catch (err) {

          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.textContent = window.getSelection().toString() || url;
          this._insertHTMLAtCursor(a.outerHTML);
        }
        this._save();
      });
    }

    const uploader = document.getElementById('imageUploader');
    const insertImageBtn = document.getElementById('insertImage');
    if (insertImageBtn && uploader) {
      insertImageBtn.addEventListener('click', () => uploader.click());
      uploader.addEventListener('change', (e) => this._handleImageUpload(e));
    }
    const imageUrlInput = document.getElementById('imageURL');
    if (imageUrlInput) {
      imageUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const url = e.target.value.trim();
          if (url) {
            this._restoreSelection();
            this.root.focus();
            try {
              document.execCommand('insertImage', false, url);
            } catch (err) {
              this._insertHTMLAtCursor(`<img src="${url}" alt="" />`);
            }
            e.target.value = '';
            this._save();
          }
        }
      });
    }

    const insertTableBtn = document.getElementById('insertTable');
    if (insertTableBtn) {
      insertTableBtn.addEventListener('click', () => {
        let r = parseInt(prompt('Rows', '2')) || 0;
        let c = parseInt(prompt('Columns', '2')) || 0;
        if (r > 0 && c > 0) {
          const tbl = this._buildTableHTML(r, c);
          this._insertHTMLAtCursor(tbl);
          this._save();
        }
      });
    }


    const removeFormatBtn = document.getElementById('removeFormat');
    if (removeFormatBtn) {
      removeFormatBtn.addEventListener('click', () => {
        this._restoreSelection();
        this.root.focus();
        try {
          document.execCommand('removeFormat', false, null);
        } catch (err) {

        }

        this._unwrapTags(['span', 'font']);
        this._save();
      });
    }


    const resetBtn = document.getElementById('resetContent');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset editor content? This will clear saved draft.')) {
          this.root.innerHTML = '';
          localStorage.removeItem(this.autosaveKey);
          this._setSaved('Never');
        }
      });
    }

    const copyPlainBtn = document.getElementById('copyPlain');
    if (copyPlainBtn) {
      copyPlainBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(this.root.innerText);
          alert('Plain text copied to clipboard');
        } catch (err) {
          console.warn('copy plain failed', err);

          const ta = document.createElement('textarea');
          ta.value = this.root.innerText;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          alert('Plain text copied (fallback)');
        }
      });
    }


    const copyHTMLBtn = document.getElementById('copyHTML');
    if (copyHTMLBtn) {
      copyHTMLBtn.addEventListener('click', async () => {
        const html = this.root.innerHTML;
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            const blob = new Blob([html], { type: 'text/html' });
            const item = new ClipboardItem({ 'text/html': blob });
            await navigator.clipboard.write([item]);
            alert('HTML copied to clipboard');
          } else {
            await navigator.clipboard.writeText(html);
            alert('HTML copied as plain text fallback');
          }
        } catch (err) {
          console.warn('copy HTML failed', err);

          try {
            await navigator.clipboard.writeText(html);
            alert('HTML copied as plain text fallback');
          } catch (e) {
            alert('Copy failed');
          }
        }
      });
    }


    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.preview());
    }
    const closePreview = document.getElementById('closePreview');
    if (closePreview) {
      closePreview.addEventListener('click', () => {
        document.getElementById('previewModal').setAttribute('aria-hidden', 'true');
      });
    }


    const exportDocBtn = document.getElementById('exportDoc');
    if (exportDocBtn) {
      exportDocBtn.addEventListener('click', () => {
        const exporter = new Exporter(this);
        exporter.exportDoc();
      });
    }
    const exportPDFBtn = document.getElementById('exportPDF');
    if (exportPDFBtn) {
      exportPDFBtn.addEventListener('click', () => {
        const exporter = new Exporter(this);
        exporter.exportPDF();
      });
    }


    const toggleThemeBtn = document.getElementById('toggleTheme');
    if (toggleThemeBtn) {
      toggleThemeBtn.addEventListener('click', () => this._toggleTheme());
    }

    const clearStorageBtn = document.getElementById('clearStorage');
    if (clearStorageBtn) {
      clearStorageBtn.addEventListener('click', () => {
        if (confirm('Clear auto-saved draft from localStorage?')) {
          localStorage.removeItem(this.autosaveKey);
          this._setSaved('Never');
          alert('Draft cleared');
        }
      });
    }
        const newPageBtn = document.getElementById('newPage');
    if (newPageBtn) {
      newPageBtn.addEventListener('click', () => {
        if (confirm('Start a new page? Current content will be cleared.')) {
          this.root.innerHTML = '';   
          if (this.titleEl) this.titleEl.value = '';  
          if (this.authorEl) this.authorEl.value = '';
          localStorage.removeItem(this.autosaveKey);  
          this._setSaved('Never');   
        }
      });
    }

  }
    _setupImageEditing() {
    // Click to select/deselect images
    this.root.addEventListener("click", (e) => {
      if (e.target.tagName === "IMG") {
        if (this.selectedImg) this.selectedImg.classList.remove("selected");
        this.selectedImg = e.target;
        this.selectedImg.classList.add("editable-img", "selected");
      } else {
        if (this.selectedImg) this.selectedImg.classList.remove("selected");
        this.selectedImg = null;
      }
    });


    document.addEventListener("keydown", (e) => {
      if (e.key === "Delete" && this.selectedImg) {
        this.selectedImg.remove();
        this.selectedImg = null;
        this._save();
      }
    });
  }

  _handleImageUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        this._restoreSelection();
        this.root.focus();
        document.execCommand('insertImage', false, ev.target.result);
      } catch (err) {

        this._insertHTMLAtCursor(`<img src="${ev.target.result}" alt="" />`);
      }
      this._save();
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  }

  _buildTableHTML(rows, cols) {
    let html = '<table border="1" style="border-collapse:collapse;width:100%">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) html += '<td>&nbsp;</td>';
      html += '</tr>';
    }
    html += '</table><p></p>';
    return html;
  }

  _insertHTMLAtCursor(html) {
    try {
      this._restoreSelection();
      this.root.focus();
      document.execCommand('insertHTML', false, html);
    } catch (e) {

      this.root.insertAdjacentHTML('beforeend', html);
    }
  }

  _unwrapTags(tags) {
    tags.forEach(tag => {
      const els = this.root.querySelectorAll(tag);
      els.forEach(el => {
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      });
    });
  }

  _setupAutoSave() {
    let timeout = null;
    const save = () => {
      const payload = {
        title: this.titleEl ? this.titleEl.value : '',
        author: this.authorEl ? this.authorEl.value : '',
        content: this.root.innerHTML,
        savedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(this.autosaveKey, JSON.stringify(payload));
        this._setSaved(new Date().toLocaleString());
      } catch (e) {
        console.warn('autosave failed', e);
      }
    };
    [this.root, this.titleEl, this.authorEl].forEach(el => {
      if (!el) return;
      el.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(save, 1000);
      });
    });
  }

  _restore() {
    try {
      const raw = localStorage.getItem(this.autosaveKey);
      if (raw) {
        const obj = JSON.parse(raw);
        if (this.titleEl) this.titleEl.value = obj.title || '';
        if (this.authorEl) this.authorEl.value = obj.author || '';
        if (obj.content) this.root.innerHTML = obj.content;
        if (obj.savedAt) this._setSaved(new Date(obj.savedAt).toLocaleString());
      }
    } catch (e) {
      console.warn('restore failed', e);
    }
  }

  _save() {
    try {
      const payload = {
        title: this.titleEl ? this.titleEl.value : '',
        author: this.authorEl ? this.authorEl.value : '',
        content: this.root.innerHTML,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(this.autosaveKey, JSON.stringify(payload));
      this._setSaved(new Date().toLocaleString());
    } catch (e) {
      console.warn('save failed', e);
    }
  }

  _setSaved(text) { if (this.status) this.status.textContent = text; }

  preview() {
    const frame = document.getElementById('previewFrame');
    const modal = document.getElementById('previewModal');
    const title = (this.titleEl && this.titleEl.value) || 'Preview';
    const author = (this.authorEl && this.authorEl.value) || '';
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${this._esc(title)}</title></head><body><h1>${this._esc(title)}</h1><div>By ${this._esc(author)}</div><hr>${this.root.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    if (frame) {
      frame.src = url;
      modal && modal.setAttribute('aria-hidden', 'false');
    } else {
      const w = window.open('');
      w.document.write(html);
      w.document.close();
    }
  }

  _esc(s) { return (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  _setupTheme() {
    const key = 'wp_ce_theme_v1';
    const cur = localStorage.getItem(key) || 'light';
    document.documentElement.setAttribute('data-theme', cur);
    const btn = document.getElementById('toggleTheme');
    if (btn) btn.textContent = cur === 'dark' ? '☀️' : '🌙';
  }

  _toggleTheme() {
    const key = 'wp_ce_theme_v1';
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(key, next);
    const btn = document.getElementById('toggleTheme');
    if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
  }
}

class Exporter {
  constructor(editorInstance) {
    this.editor = editorInstance;
  }

  _buildHTML() {
    const title = this.editor.titleEl ? this.editor.titleEl.value : 'Document';
    const author = this.editor.authorEl ? this.editor.authorEl.value : '';
    const css = `
      body{font-family: Arial, Helvetica, sans-serif; padding:20px;}
      table{border-collapse:collapse;}
      table td, table th{border:1px solid #999; padding:6px;}
    `;
    return `<!doctype html><html><head><meta charset="utf-8"><title>${this._esc(title)}</title><style>${css}</style></head><body><h1>${this._esc(title)}</h1><div>By ${this._esc(author)}</div><hr>${this.editor.root.innerHTML}</body></html>`;
  }

  exportDoc() {
    try {
      const html = this._buildHTML();
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (this.editor.titleEl && this.editor.titleEl.value ? this.editor.titleEl.value : 'document') + '.doc';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('exportDoc failed', e);
      alert('Export to .doc failed: ' + (e.message || e));
    }
  }

  exportPDF() {
    try {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = this._buildHTML();
      const opt = {
        margin: 10,
        filename: (this.editor.titleEl && this.editor.titleEl.value ? this.editor.titleEl.value : 'document') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      if (typeof html2pdf === 'undefined') {
        alert('html2pdf.js not loaded (PDF export unavailable).');
        return;
      }
      html2pdf().set(opt).from(wrapper).save();
    } catch (e) {
      console.error('exportPDF failed', e);
      alert('Export to PDF failed: ' + (e.message || e));
    }
  }

  _esc(s) { return (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
}


window.addEventListener('DOMContentLoaded', () => {
  window.wpEditor = new Editor('editor');
});
