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
}
}
