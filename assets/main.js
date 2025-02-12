window.onload = function() {
    var base, cList, cBox, cDiv;
    
    function _encode(str="") {
        return str.split("").map(function(v){
            if(!v.match(/[a-zA-Z0-9]/)) {
                return "##cd" + v.charCodeAt() + "##";
            }
            return v;
        }).join("");
    }
    function _decode(str) {
        return (str||"").replace(/##cd(\d+?)##/g, function(a,b) {
            return String.fromCharCode(b);
        });
    }
    function getAssets(filename) {
        return new Promise(function(r) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', chrome.runtime.getURL(filename), true);
            xhr.onreadystatechange = function() {
                if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    r(xhr.responseText);
                }
            };
            xhr.send();
        });
    }
    function detectTA(e) {
        if(e.target.id == "edit-page-textarea") {
            var s = document.createElement("style");
            s.innerHTML = '.candyBox {background: #fff;box-shadow: 1px 1px 3px #aaa;font-family: courier;font-size: .8em;max-height: 6rem;max-width: 12rem;overflow-y: scroll;position: absolute;text-align: left;width: 99rem;}.candyBox a {cursor: pointer;display: block;padding: .35em .5em;transition: all .175s ease-in-out;}.candyBox a span {display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 1;overflow: hidden;white-space: pre;}.candyBox a.selected, .candyBox a:hover {background: #b01;color: #fff;}';
            document.head.appendChild(s);
            var p = e.target.parentNode;
            p.style.position = "relative";
            e.target.style.outline = "solid 2px #b01";
            var _e = e;
            
            e.target.onkeyup = function(e) {
                var key = e.code;
                var sel = (cBox&&cBox.querySelector("a.selected")) ? true : false;
                if( !((key=="Enter"&&sel)||(key=="ArrowUp"&&cBox)||(key=="ArrowDown"&&cBox)) ) {
                    candyBox(_e.target, p);
                }
            }
            e.target.onkeydown = function(e) {
                var box = cBox;
                var key = e.code;
                if(box) {
                    var a = box.querySelector("a");
                    var s = box.querySelector("a.selected");
                    if((key=="Enter"&&s)||(key=="ArrowUp"&&a)||(key=="ArrowDown"&&a)) {


                        e.preventDefault();
                        e.stopPropagation();
                        if(s) {
                            switch(key) {
                                case "Enter":
                                    s.onclick({"target": s});
                                    break;
                                case "ArrowUp":
                                    if(s.previousElementSibling && s.previousElementSibling.tagName=="A") {
                                        s.classList.remove("selected");
                                        s.previousElementSibling.classList.add("selected");
                                        box.scrollTop -= s.previousElementSibling.offsetHeight;
                                    }
                                    break;
                                case "ArrowDown":
                                    if(s.nextElementSibling && s.nextElementSibling.tagName=="A") {
                                        s.classList.remove("selected");
                                        s.nextElementSibling.classList.add("selected");
                                        box.scrollTop += s.nextElementSibling.offsetHeight;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }else {
                            switch(key) {
                                case "ArrowUp":
                                    a.classList.add("selected");
                                    break;
                                case "ArrowDown":
                                    if(a.nextElementSibling && a.nextElementSibling.tagName=="A") {
                                        a.nextElementSibling.classList.add("selected");
                                    }else {
                                        a.classList.add("selected");
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        return false;
                    }
                }
            }
            document.body.removeEventListener("click", detectTA);
        }
    }
    function candyBox(t, p) {
        cBox = null;
        for (var a of document.querySelectorAll(".candyBox")) {
            a.remove();
        }
        function getCaret(node) {
            if (node.selectionStart) {
                return node.selectionStart;
            } else if (!document.selection) {
                return 0;
            }
            var c = "\001"
              , sel = document.selection.createRange()
              , dul = sel.duplicate()
              , len = 0;
            dul.moveToElementText(node);
            sel.text = c;
            len = dul.text.indexOf(c);
            sel.moveStart('character', -1);
            sel.text = "";
            return len;
        }
        var index = getCaret(t);

        var before = t.value.substring(0, index);
        var after = t.value.substring(index);

        var bef_m = before.match(/([\s\S]*?)(\![a-zA-Z]*?)$/);
        
        if (!bef_m)
            return;
        var cand = cList.filter(v=>v.match(new RegExp("^" + bef_m[2],"i")));
        if (!cand.length)
            return;
        var bef = bef_m[1];
        var aft = after;

        var div = document.createElement("div");

        var box = document.createElement("div");

        box.classList.add("candyBox");

        var t_style = window.getComputedStyle(t);

        for (var k in t_style) {
            div.style[k] = t_style[k];
        }
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word'; 

        var scale = t_style.transform.split(/[^\d.]/).filter(function(v) {
            return v
        });
        var scale_x = scale[0];
        var scale_y = scale[3];

        div.innerText = before;
        var span = document.createElement('span');
        span.innerHTML = '&nbsp;';
        div.scrollTop = div.scrollHeight;
        div.appendChild(span);
        document.body.appendChild(div);
        var d = div.getBoundingClientRect();
        var s = span.getBoundingClientRect();
        var r = {
            top: s.top - d.top,
            left: s.left - d.left
        };
        div.remove();

        box.style.top = 'calc(' + (r.top - t.scrollTop * (scale_y ? Number(scale_y) : 1)) + 'px + 1rem)';
        box.style.left = (r.left - t.scrollLeft * (scale_x ? Number(scale_x) : 1)) + 'px';
        p.appendChild(box);
        var width = 0;

        for (var c of cand) {
            var l = document.createElement("a");
            var s = document.createElement("span");
            
            s.innerHTML = base.list[c].display;
            s.setAttribute("data-start", _encode(base.list[c].value[0]));
            s.setAttribute("data-end", _encode(base.list[c].value[1]));
            
            l.appendChild(s);
            box.appendChild(l);
            width = width < s.clientWidth ? s.clientWidth : width;
            l.onclick = function(e) {
                var elm = e.target.tagName=="A" ? e.target.children[0] : e.target;
                var t_s = _decode(elm.getAttribute("data-start"));
                var t_e = _decode(elm.getAttribute("data-end"));
                
                var a = bef + t_s;
                var b = (t_e=="" ? "" : "text");
                var c = t_e + aft;
                
                t.value = a + b + c;
                
                var index = (t_e=="" ? a.length : (a+b).length);
                t.setSelectionRange(a.length, index);
                t.focus();
                t.blur();
                t.focus();
                box.remove();
            }
        }

        box.style.width = `calc(1.8em + ${width}px)`;
        cBox = box;
        cDiv = div;
    }
    
    getAssets('assets/list.json').then(function(r) {
        base = JSON.parse(r);
        cList = Object.keys(base.list);
        console.log(base);
        document.body.addEventListener("click", detectTA);
    })
}
