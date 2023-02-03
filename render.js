var xm_utils = {
    pair(__) {
        return new RegExp('(?<!\\\\)' + __ + '([\\s\\S\\n]*?)' + __, 'g')
    },
    tag(__) {
        return `<${__}>$1</${__}>`
    },
    make_tuple(pair, tag) {
        return [this.pair(pair), this.tag(tag)]
    },
    handleColor(match = '', ...p) {
        let attr = p[0]
        let content = p[1]
        return `<font color="${attr}">${content}</font>`
    },
    handleTag(match = '', ...p) {
        let attr = p[0]
        let content = p[1]
        return `<${attr}>${content}</${attr}>`
    },
    handleHeading(match = '', ...p) {
        let level = p[0].length
        let content = p[1]
        return `<h${level}>${content}</h${level}>`
    },
    handleSummary(match = '', ...p) {
        let summary = p[0]
        let content = p[1]
        return `<details><summary>${summary}</summary>${content}</details>`
    },
}
var xingmark = {
    repl: {
        summary: [/^> ?(.*?) ?{([\s\S\n]*?)}/mg, xm_utils.handleSummary],
        hr: [/^---$/mg, '<hr>'],
        continuation: [/(?<!\\)\\\n/g, ''],
        escape: [/(?<!\\)\\\n?(?!\\)/g, ''],
        linebreak: [/\n/g, '<br>'],
        escape0: [/\\\\/g, '\0'],
        color: [/(?<!\\)\(([^\n\\]*?): ?([\s\S\n]*?)\)/g, xm_utils.handleColor],
        tag: [/(?<!\\)\[([^\n\\]*?): ?([\s\S\n]*?)\]/g, xm_utils.handleTag],
        heading: [/^(\+{1,6}) ?(.+)/mg, xm_utils.handleHeading],
        bold: xm_utils.make_tuple('##', 'strong'),
        italic: xm_utils.make_tuple('//', 'i'),
        underlined: xm_utils.make_tuple('__', 'u'),
        strikethrough: xm_utils.make_tuple('--', 'del'),
        mark: xm_utils.make_tuple('==', 'mark'),
        sub: xm_utils.make_tuple(',,', 'sub'),
        sup: xm_utils.make_tuple('\\^\\^', 'sup'),
        escape2: [/\0/g, '\\'],
    },
    render(text = '') {
        let res = text
        for (let repl in this.repl) {
            res = res.replace(this.repl[repl][0], this.repl[repl][1])
        }
        res = res.replace(/^(<h[1-6]>)/, '<br>$1').replace(/(<br>(?=<hr>|<\/details>))|((?<=<hr>|<\/summary>)<br>)/g, '')
        return res
    }
}