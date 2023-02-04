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
    handleTag(match = '', ...p) {
        let start = p[0]
        let tagname = p[1]
        let content = p[2]
        return `<${start}>${content}</${tagname}>`
    },
    handleHeading(match = '', ...p) {
        let level = p[0].length
        let content = p[1]
        return `<h${level}>${content}</h${level}>` + '\1\n'
    },
    handleUl(match = '', ...p) {
        level = p[0].length + 1
        return '<ul>'.repeat(level) + '<li>' + p[1] + '</li>' + '</ul>'.repeat(level) + '\1\n'
    },
    handleOl(match = '', ...p) {
        level = p[0].length + 1
        return '<ol>'.repeat(level) + '<li>' + p[1] + '</li>' + '</ol>'.repeat(level) + '\1\n'
    },
    detailStart(match = '', ...p) {
        let summary = p[0]
        if (summary) {
            return `<details><summary>${summary}</summary>`
        } else {
            return `<details>`
        }
    },
    search(pattern, str) {
        let result = []
        match = str.match(pattern)
        while (match) {
            result.push(str.slice(0, match.index), match[0])
            str = str.slice(match.index + match[0].length)
            match = str.match(pattern)
        }
        result.push(str)
        return result
    },
    multisearch(patterns, str) {
        let tmp = this.search(patterns[0], str)
        let tmp2 = []
        for (let i = 1; i < patterns.length; i++) {
            tmp.forEach(sub => {
                tmp2 = tmp2.concat(this.search(patterns[i], sub))
            })
            tmp = tmp2
            tmp2 = []
        }
        return tmp
    },
    altersearch(patterns, str) {
        let p1 = patterns[0]
        let p2 = patterns[1]
        let pattern = p1
        let result = []
        match = str.match(pattern)
        while (match) {
            result.push(str.slice(0, match.index), match[0])
            str = str.slice(match.index + match[0].length)
            pattern = pattern == p1 ? p2 : p1
            match = str.match(pattern)
        }
        result.push(str)
        return result
    },
    nest(text, rule) {
        let start = rule.start[0]
        let end = rule.end[0]
        let list = this.multisearch([start, end], text)
        let level = 0
        let cases = []
        let levels = []
        for (let sub of list) {
            levels.push(level)
            if (start.test(sub)) {
                cases.push(1)
                level++
            } else if (end.test(sub) && level > 0) {
                cases.push(-1)
                level--
            } else {
                cases.push(0)
            }
        }
        let tmps = []
        let result = []
        for (let i = 0; i < cases.length; i++) {
            if (cases[i] == 1) {
                tmps.push(list[i].match(start))
                result.push(list[i].replace(start, rule.start[1]))
            } else if (cases[i] == -1 && levels[i] > 0) {
                result.push(list[i].replace(end, rule.end[1]).replace('\0', tmps[tmps.length - 1][1]))
                tmps.pop()
            } else {
                result.push(list[i])
            }
        }
        return result.join('')
    },
    noNest(text, rule) {
        let start = rule.start[0]
        let end = rule.end[0]
        let list = this.altersearch([start, end], text)
        let result = []
        for (let i = 0; i < list.length; i++) {
            if (i % 4 == 1) {
                result.push(list[i].replace(start, rule.start[1]))
            } else if (i % 4 == 3) {
                result.push(list[i].replace(end, rule.end[1]))
            } else {
                result.push(list[i])
            }
        }
        return result.join('')
    },
}
var xingmark = {
    rules: {
        escape0: [/\\\\/g, '\0'],

        detail: {
            type: 'nest',
            start: [/(?:^|\n)> ?(.*?) ?{\n?/, xm_utils.detailStart],
            end: [/(?<!\\)\n?}/, '</details>']
        },

        hr: [/(?<=^|\n)---($|\n)/g, '<hr>\1\n'],
        continuation: [/(?<!\\)\\\n/g, '\1\n'],

        blockquote: { // no /.../g for nest!
            type: 'nest',
            start: [/(?<!\\)\[:(?: |\n)?/, '<blockquote>'],
            end: [/\n?\]\n?/, '</blockquote>'],
        },

        color: {
            type: 'nest',
            start: [/(?<!\\)\("?([^\n\\]*?)"?:(?: |\n)?/, '<font color="$1">'],
            end: [/\n?\)/, '</font>'],
        },

        tag: {
            type: 'nest',
            start: [/(?<!\\)\[(([a-z\-]+)(?: ?(?:[a-z\-]+?="[^"]*"|[a-z\-]+) ?)*):(?: |\n)?/, '<$1>'],
            end: [/\n?\]/, '</\0>'],
        },

        code: {
            type: 'noNest',
            start: [/(?<![\\])`\n?/, '<pre><code>'],
            end: [/(?<!\\)\n?`\n?/, '</code></pre>'],
        }, // TODO: no syntax in code

        bold: xm_utils.make_tuple('##', 'strong'),
        italic: xm_utils.make_tuple('//', 'i'),
        underlined: xm_utils.make_tuple('__', 'u'),
        strikethrough: xm_utils.make_tuple('--', 'del'),
        mark: xm_utils.make_tuple('==', 'mark'),
        sub: xm_utils.make_tuple(',,', 'sub'),
        sup: xm_utils.make_tuple('\\^\\^', 'sup'),

        heading: [/^(\+{1,6}) ?(.+)(?:\n|$)/mg, xm_utils.handleHeading],
        ul: [/^( *)- ?(.*)(?:\n|$)/mg, xm_utils.handleUl],
        ol: [/^( *)# ?(.*)(?:\n|$)/mg, xm_utils.handleOl],

        nolinebreak: [new RegExp('\1\\n', 'g'), ''],
        linebreak: [/\n/g, '<br>'],

        escape: [/(?<!\\)\\(?!\\)/g, ''],
        escape2: [/\0/g, '\\'],
        final: [new RegExp('\1', 'g'), ''], // Continuation is not supported in lists
    },
    render(text = '') {
        let res = text
        console.log(`Start rendering: \n${text}`)
        for (let key in this.rules) {
            let rule = this.rules[key]
            if (Array.isArray(rule)) {
                res = res.replace(rule[0], rule[1])
            } else if (typeof rule == 'object') {
                if (rule.type == 'nest') {
                    res = xm_utils.nest(res, rule)
                } else if (rule.type == 'noNest') {
                    res = xm_utils.noNest(res, rule)
                }
            }
            console.log(`Rule ${key}, Result: \n${res}`)
        }
        res = res.replace(/^(<h[1-6]>)/, '<br>$1')
        while (new RegExp('<\\/ul>(\1\n)?<ul>|<\\/ol>(\1\n)?<ol>').test(res)) {
            res = res.replace(new RegExp('<\\/ul>(\1\n)?<ul>|<\\/ol>(\1\n)?<ol>', 'g'), '')
        }
        res = res.replace(new RegExp('\1\n$'), '')
        console.log(`Final result: \n${res}`)
        return res
    }
}