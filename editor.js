class Editor {
    constructor(rootID){
        this.root=document.getElementById(rootId)
        this.titleEl=document.getElementById('docTitle')
        this.authorEl=document.getElementById('docAuthor')
        this.status=document.getElementById('savedAt')
        this.autosaveKey='wp_ce_draft_v1'
        this._init()
    }
    _init(){
    this._bindToolbar()
    this._restore()
    this._setupAutoSave()
    this._setupTheme()
}
_bindToolbar(){
    document.querySelectorAll('[data-cmd]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            const cmd=btn.getAttribute('data-cmd')
            document.execCommand(cmd, false,null)
            this.root.focus()
        })
    })
    document.getElementById('fontFamily').addEventListener('change', (e)=>{
        document.execCommand('fontName',false,e.target.value)
    })
    document.getElementById('fontSize').addEventListener('change',(e)=>{
        document.execCommand('fontSize',false,e.target.value)
    })
    document.getElementById('formatBlock').addEventListener('change', (e)=>{
const val = e.target.value;
document.execCommand('formatBlock', false, '<' + val + '>');
});
document.getElementById('foreColor').addEventListener('input',(e)=>{
    document.execCommand('foreColor',false,e.target.value)
})
document.getElementById('hiliteColor').addEventListener('input', (e)=>{
document.execCommand('hiliteColor', false, e.target.value);
document.execCommand('backColor', false, e.target.value);
});
document.getElementById('createLink').addEventListener('click', ()=>{
const url = prompt('Enter URL (include http:// or https://):', 'https://');
if(url) document.execCommand('createLink', false, url);
});
const uploader = document.getElementById('imageUploader');
document.getElementById('insertImage').addEventListener('click', ()=>uploader.click());
uploader.addEventListener('change', (e)=>this._handleImageUpload(e));
document.getElementById('imageURL').addEventListener('keypress', (e)=>{
if(e.key === 'Enter'){
const url = e.target.value.trim();
if(url){
document.execCommand('insertImage', false, url);
e.target.value = '';
}
}
});
document.getElementById('insertTable').addEventListener('click', ()=>{
let r = parseInt(prompt('Rows', '2')) || 0;
let c = parseInt(prompt('Columns', '2')) || 0;
if(r>0 && c>0){
const tbl = this._buildTableHTML(r,c);
this._insertHTMLAtCursor(tbl);
}
});
document.getElementById('removeFormat').addEventListener('click', ()=>{
      document.execCommand('removeFormat', false, null);
    });
     document.getElementById('resetContent').addEventListener('click', ()=>{
      if(confirm('Reset editor content?')){
        this.root.innerHTML='';
        localStorage.removeItem(this.autosaveKey);
        this._setSaved('Never');
      }
    });
      document.getElementById('copyPlain').addEventListener('click', ()=>{
      navigator.clipboard.writeText(this.root.innerText);
      alert('Plain text copied');
    });
     document.getElementById('copyHTML').addEventListener('click', ()=>{
      navigator.clipboard.writeText(this.root.innerHTML);
      alert('HTML copied');
    });
      document.getElementById('previewBtn').addEventListener('click', ()=>this.preview());
    document.getElementById('closePreview').addEventListener('click', ()=>{
      document.getElementById('previewModal').setAttribute('aria-hidden','true');
    });
     document.getElementById('exportDoc').addEventListener('click', ()=>{
      new Exporter(this).exportDoc();
    });
    document.getElementById('exportPDF').addEventListener('click', ()=>{
      new Exporter(this).exportPDF();
    });
      document.getElementById('toggleTheme').addEventListener('click', ()=>this._toggleTheme());
    document.getElementById('clearStorage').addEventListener('click', ()=>{
      localStorage.removeItem(this.autosaveKey);
      this._setSaved('Never');
      alert('Draft cleared');
    });
}
_handleImageUpload(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev=>{
      document.execCommand('insertImage', false, ev.target.result);
    };
    reader.readAsDataURL(file);
  }
    _buildTableHTML(rows, cols){
    let html='<table border="1" style="border-collapse:collapse;width:100%">';
    for(let r=0;r<rows;r++){
      html+='<tr>';
      for(let c=0;c<cols;c++) html+='<td>&nbsp;</td>';
      html+='</tr>';
    }
    html+='</table><p></p>';
    return html;
  }
  
  _insertHTMLAtCursor(html){
    document.execCommand('insertHTML', false, html);
  }
   _setupAutoSave(){
    let timeout=null;
    const save=()=>{
      const data={title:this.titleEl.value,author:this.authorEl.value,content:this.root.innerHTML,savedAt:new Date().toISOString()};
      localStorage.setItem(this.autosaveKey, JSON.stringify(data));
      this._setSaved(new Date().toLocaleString());
    };
    [this.root,this.titleEl,this.authorEl].forEach(el=>{
      el.addEventListener('input',()=>{
        clearTimeout(timeout);
        timeout=setTimeout(save,1000);
      });
    });
  }
    _restore(){
    const raw=localStorage.getItem(this.autosaveKey);
    if(raw){
      const obj=JSON.parse(raw);
      this.titleEl.value=obj.title||'';
      this.authorEl.value=obj.author||'';
      this.root.innerHTML=obj.content||'';
      this._setSaved(new Date(obj.savedAt).toLocaleString());
    }
  }
   _setSaved(text){ this.status.textContent=text; }
   preview(){
    const frame=document.getElementById('previewFrame');
    const modal=document.getElementById('previewModal');
    const html=`<!doctype html><html><body><h1>${this.titleEl.value}</h1><div>By ${this.authorEl.value}</div><hr>${this.root.innerHTML}</body></html>`;
    frame.src=URL.createObjectURL(new Blob([html],{type:'text/html'}));
    modal.setAttribute('aria-hidden','false');
  }
    _setupTheme(){
    const key='wp_ce_theme_v1';
    const cur=localStorage.getItem(key)||'light';
    document.documentElement.setAttribute('data-theme',cur);
    document.getElementById('toggleTheme').textContent=cur==='dark'?'☀️':'🌙';
  }
}
class Exporter {
    constructor(editor){ this.editor=editor; }

  _buildHTML(){
    return `<!doctype html><html><body><h1>${this.editor.titleEl.value}</h1><div>By ${this.editor.authorEl.value}</div><hr>${this.editor.root.innerHTML}</body></html>`;
  }
   exportDoc(){
    const blob=new Blob([this._buildHTML()],{type:'application/msword'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=(this.editor.titleEl.value||'document')+'.doc';
    a.click();
  }
}
