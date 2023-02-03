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
        let start = p[0]
        let tagname = p[1]
        let content = p[2]
        return `<${start}>${content}</${tagname}>`
    },
    handleHeading(match = '', ...p) {
        let level = p[0].length
        let content = p[1]
        return `<h${level}>${content}</h${level}>`
    },
    handleSummary(match = '', ...p) {
        let summary = p[0]
        let content = p[1]
        if (summary) {
            return `<details><summary>${summary}</summary>${content}</details>`
        } else {
            return `<details>${content}</details>`
        }
    },
}
var xingmark = {
    repl: {
        escape0: [/\\\\/g, '\0'],

        summary: [/^> ?(.*?) ?{\n?([\s\S\n]*?)\n?}/mg, xm_utils.handleSummary],
        hr: [/(^|\n)---($|\n)/g, '<hr>'],
        continuation: [/(?<!\\)\\\n/g, ''],

        blockquote: [/(?<!\\)\[:(?: |\n)?([\s\S\n]*?)\n?\]/g, '<blockquote>$1</blockquote>'],
        color: [/(?<!\\)\(([^\n\\]*?):(?: |\n)?([\s\S\n]*?)\n?\)/g, xm_utils.handleColor],
        //               ( red       :          red text       )
        tag: [/(?<!\\)\[(([a-z\-]+)(?: ?(?:[a-z\-]+?="[^"]*" ?|[a-z\-]+) ?)*):(?: |\n)?([\s\S\n]*?)\n?\]/g, xm_utils.handleTag],
        //             [  div                   style="color:red"           :            in div       ]
        heading: [/^(\+{1,6}) ?(.+)/mg, xm_utils.handleHeading],

        bold: xm_utils.make_tuple('##', 'strong'),
        italic: xm_utils.make_tuple('//', 'i'),
        underlined: xm_utils.make_tuple('__', 'u'),
        strikethrough: xm_utils.make_tuple('--', 'del'),
        mark: xm_utils.make_tuple('==', 'mark'),
        sub: xm_utils.make_tuple(',,', 'sub'),
        sup: xm_utils.make_tuple('\\^\\^', 'sup'),

        linebreak: [/\n/g, '<br>'],

        escape: [/(?<!\\)\\(?!\\)/g, ''],
        escape2: [/\0/g, '\\'],
    },
    render(text = '') {
        let res = text
        for (let repl in this.repl) {
            res = res.replace(this.repl[repl][0], this.repl[repl][1])
        }
        res = res.replace(/^(<h[1-6]>)/, '<br>$1')
        return res
    }
}