;(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory(global);
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(global);
    } else {
        global.Render = factory(global);
    }
}(typeof window !== 'undefined' ? window : this, function (window) {
    function Render (opts) {
        this.VNode = _proto.createVirtualDom(opts.htmlString);
    }

    var _proto = {
        render: function (size) {
            var me = this;

            if (!this.VNode) {
                return '';
            }

            var renderStage = document.getElementById('render-stage');

            renderStage && renderStage.parentNode.removeChild(renderStage);
            var renderStage = document.createElement('div');

            renderStage.id = 'render-stage';
            renderStage.innerHTML = '<div class="box-inner"></div>';
            Utils.css(renderStage, {
                width: size.width + 'px',
                height: size.height + 'px',
                position: 'absolute',
                overflow: 'hidden',
                left: -10000 + 'px',
                top: 0
            });
            document.body.appendChild(renderStage);
            this.box = renderStage;
            this.content = Utils.GetByClass(renderStage, 'box-inner')[0];
            this.overflowVNode = JSON.parse(JSON.stringify(this.VNode));
            this.size = size;
            this.params = {
                stop: false
            };
            this.virtualDomRender(this.content, this.VNode.children, this.params);
            if (!this.params.stop) {
                this.overflowVNode = null;
            }
            var rendedHtml = this.content.innerHTML;
            this.box.parentNode.removeChild(this.box);
            this.VNode = this.overflowVNode;
            return rendedHtml;
        },
        end: function (params) {
            // 回手掏，从此vnode向上找，把之前的分叉树全干掉
            if (params.vNode.nodeType == 3) {
                var VNode = this.findVNode(params.vNode.id, this.overflowVNode);

                VNode.nodeValue = params.vNode.nodeValue;
            }
            this.clearPrev(params.vNode, this.overflowVNode);
        },
        createVirtualDom: function (htmlString) {
            var virtualDom = {
                id: 'root',
                children: []
            };

            var fragment = document.getElementById('fragment');
            fragment && fragment.parentNode.removeChild(fragment);
            fragment = document.createElement('div');
            fragment.id = 'fragment';
            Utils.css({
                'display': 'none'
            });
            fragment.innerHTML = htmlString;
            document.body.appendChild(fragment);
            this.readDomTree(virtualDom.children, fragment, 'root');
            fragment.parentNode.removeChild(fragment);
            return virtualDom;
        },
        readDomTree: function (virtualDom, parentNode, virtualDomId) {
            var me = this;
            var childNodes = parentNode.childNodes;
            if (!childNodes.length) return;

            [].slice.call(childNodes).forEach(function (child) {
                var node = {
                    id: 'VNode_' + Math.random().toString(36).substr(2),
                    tagName: '',
                    attrs: {},
                    nodeType: '',
                    nodeValue: '',
                    nodeValueRended: [],
                    children: [],
                    rended: false,
                    parentVnodeId: virtualDomId || 'root'
                };
                var attributes = child.attributes;

                if (Utils.isElementNode(child)) {
                    node.nodeType = 1;
                    node.tagName = child.tagName.toLocaleLowerCase();
                } else if (Utils.isTextNode(child)) {
                    node.nodeType = 3;
                    node.nodeValue = child.nodeValue.split('');
                } else {
                    return;
                }

                if (attributes) {
                    for (var i = 0; i < attributes.length; i++) {
                        var attr = attributes[i].nodeName;
                        var val = attributes[i].nodeValue;

                        node.attrs[attr] = val;
                    }
                }

                if (Utils.isElementNode(child)) {
                    me.readDomTree(node.children, child, node.id);
                }

                virtualDom.push(node);
            });
        },
        clearPrev: function (child, root) {
            var parentNode = this.findVNode(child.parentVnodeId, root);
            if (!parentNode) return;
            var childId = child.id;
            var children = parentNode.children;

            for (var i = 0; i < children.length; i++) {
                if (children[i].id != childId) {
                    children.splice(i, 1);
                    i--;
                } else {
                    break;
                }
            }

            this.clearPrev(parentNode, root);
        },
        findVNode: function (nodeId, node) {
            if (nodeId == node.id) {
                return node;
            }
            for (var i = 0; i < node.children.length; i++) {
                var result = this.findVNode(nodeId, node.children[i]);

                if (result) {
                    return result;
                }
            }

            return null;
        },
        virtualDomRender: function (parent, virtualDom, params) {
            var me = this;

            if (!virtualDom.length || params.stop) {
                return;
            };

            var currentVirtualDom = virtualDom.shift();

            if (currentVirtualDom.nodeType === 1) {
                var node = document.createElement(currentVirtualDom.tagName);

                for (var attr in currentVirtualDom.attrs) {
                    node.setAttribute(attr, currentVirtualDom.attrs[attr]);
                }

                var pass = this.canRender({
                    type: 'tag',
                    value: node,
                    parent: parent,
                    virtualDom: currentVirtualDom
                });
                if (!pass) {
                    return;
                };

                if (currentVirtualDom.children.length) {
                    this.virtualDomRender(node, currentVirtualDom.children, params);
                }
            } else {
                this.renderText(parent, currentVirtualDom, params);
            }

            this.virtualDomRender(parent, virtualDom, params);
        },
        canRender: function (renderObj) {
            var me = this;

            if (me.params.stop) {
                return true;
            }

            if (renderObj.type === 'tag' || renderObj.type === 'text') {
                renderObj.parent.appendChild(renderObj.value);
                var contentHeight = parseFloat(Utils.getStyle(me.content, 'height'));
                var overflow = contentHeight > me.size.height;

                if (overflow) {
                    me.params.stop = true;
                    this.end({
                        vNode: renderObj.virtualDom,
                        overflow: true
                    });
                    renderObj.parent.removeChild(renderObj.value);
                }
                return overflow? false: true;
            } else {
                return false;
            }
        },
        renderText: function (parent, currentVirtualDom, params) {
            if (!currentVirtualDom.nodeValue.length || params.stop) {
                return;
            };
            var willRenderTxt = currentVirtualDom.nodeValue[0];
            var willRenderNode = document.createTextNode(willRenderTxt);
            var pass = this.canRender({
                type: 'text',
                value: willRenderNode,
                parent: parent,
                virtualDom: currentVirtualDom,
                rendedText: currentVirtualDom.nodeValueRended
            });
            if (!pass) {
                return;
            };

            currentVirtualDom.nodeValueRended.push(currentVirtualDom.nodeValue.shift());
            this.renderText(parent, currentVirtualDom, params);
        }
    }

    Render.prototype = _proto;

    var Utils = {
        isElementNode: function(node) {
            return node.nodeType === 1;
        },
        isTextNode: function(node) {
            return node.nodeType === 3;
        },
        css: function(obj, name) {
            for(var i in name){
                if(i=='opacity')
                {
                    obj.style.filter='alpha(opacity:'+name[i]+')';
                    obj.style.opacity=name[i]/100;
                }
                else
                {
                    obj.style[i]=name[i];
                }
            }
        },
        GetByClass: function(obj, sName){
            if(obj.getElementsByClassName){
                return obj.getElementsByClassName(sName);
            }else{
                var arr = [ ];
                var re = new RegExp('(^|\\s)'+sName+'(\\s|$)');
                var aEle = obj.getElementsByTagName('*');

                for(var i=0; i<aEle.length; i++){
                    if(re.test(aEle[i].className)){
                        arr.push(aEle[i]);
                    };
                };

                return arr;
            };
        },
        getStyle: function (obj, name) {
            if(obj.currentStyle)
    		{
    			return obj.currentStyle[name];
    		}
    		else
    		{
    			return getComputedStyle(obj, false)[name];
    		}
        }
    };

    return Render;
}));
