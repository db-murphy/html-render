# html-render-engine

此插件解决富文本字符串在固定区域内渲染，存在尾部截断问题；

## Usage

```
npm install html-render-engine
```

js:
```
import Render from 'html-render-engine';

var renderObj = new Render({
    htmlString: '<div style="height: 200px; width: 600px;"></div><div style="height: 200px; width: 600px;"></div>' // 传入你想渲染的完整富文本字符串
});

// 返回在这个尺寸空间内能渲染的html
var rendedHtml1 = renderObj.render({
    width: 800, // 渲染宽度
    height: 300 // 渲染高度
});

// 再次调用render函数，此对象会继续渲染剩余的html，再次返回新尺寸下能渲染的html
var rendedHtml2 = renderObj.render({
    width: 300, // 渲染宽度
    height: 100 // 渲染高度
});
```

css:
```
#render-stage * {
    margin: 0;
    padding: 0;
}
```
