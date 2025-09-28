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
}
}
