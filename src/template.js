export function createTemplateEngine() {
    const neon = {};
    neonTemplates(neon);
    return neon;
}

const neonTemplates = (neon) => {
    // Cache to store compiled templates
    neon.templateCache = {};

    // Method to render templates using reactive data
    neon.render = (template, data) => {
        if (!neon.templateCache[template])
            neon.templateCache[template] = neon.compile(template);

        return neon.templateCache[template];
    };

    neon.compile = (template) => {
        let stack = [];
        let block;
        let safeIterVar;

        // Escape backslashes, single quotes, and newlines
        template = template.replace(/\\/g, '\\\\').replace(/\'/g, '\\\'').replace(/\n/g, '\\n').replace(/\r/g, '');

        // Create an array to store the dependencies
        const dependencies = new Set();
        const biDirectionalDependencies = new Set();

        // Replace conditional tags
        template = template.replace(/(\\*){(?:([\w_.\-@:]+)|>([\w_.\-@:]+)|for +([\w_\-@:]+) +in +([\w_.\-@:]+)|if +(not +|)([\w_.\-@:]+)|\/(for|if))}/g, function(str, escapeChar, key, partial, iterVar, forKey, ifNot, ifKey, closeStatement, offset, s) {
            if (escapeChar) return str.replace('\\\\', '');
            if (key) {
                // Handle else conditions
                if (key === 'else') {
                    block = stack[stack.length-1];
                    if (block && !block.elsed) {
                        block.elsed = true;
                        if (block.statement === 'if') return '\'}else{b+=\'';
                        if (block.statement === 'for') return '\'}if(!g(c,\''+block.forKey+'\')){b+=\'';
                    }
                    console.warn('extra {else} ignored');
                    return '';
                }
                dependencies.add(key);
                return '\'+g(c,\''+key+'\')+\'';
            }

            // Handle for __ in __ expressions
            if (forKey) {
                safeIterVar = iterVar.replace('-', '__');
                stack.push({statement:'for', forKey:forKey, iterVar:iterVar, safeIterVar:safeIterVar});
                dependencies.add(forKey)
                return '\';var __'+safeIterVar+'=g(c,\''+iterVar+'\');var '+safeIterVar+'A=g(c,\''+forKey+'\');for(var '+safeIterVar+'I=0;'+safeIterVar+'I<'+safeIterVar+'A.length;'+safeIterVar+'I++){c[\''+iterVar+'\']='+safeIterVar+'A['+safeIterVar+'I];b+=\'';
            }

            // Handle if or if not expressions
            if (ifKey) {
                stack.push({statement:'if'});
                dependencies.add(ifKey)
                return '\';if('+(ifNot?'!':'')+'g(c,\''+ifKey+'\')){b+=\'';
            }

            // Handle closing for or if expressions
            if (closeStatement) {
                block = stack[stack.length-1];
                if (block && block.statement === closeStatement) {
                    stack.pop();
                    return '\'}'+(block.statement === 'for' ? 'c[\''+block.iterVar+'\']=__'+block.safeIterVar+';' : '')+'b+=\'';
                }
                console.warn('extra {/'+closeStatement+'} ignored');
                return '';
            }

            // Not valid at this point, so don't replace this
            return str;
        });

        // Close For and If blocks if they haven't been closed
        for (let i=stack.length-1; i>-1; i--) {
            block = stack[i];
            template = template + '\'}b+=\'';
        }

        // Persist bound Input Values
        template = template.replace(/<(input|textarea) [^>]*\(bind\)="([^"]+)"[^>]*>/g, function(str, type, key) {
            dependencies.add(key);
            biDirectionalDependencies.add(key);
            return str.slice(0, -1) + ' value=\\"\' + g(c,\'' + key + '\') + \'\\"' + str.slice(-1);
        })

        // Props must be bound on the template side. Unidirectional binding (component -> template)
        template = template.replace(/\[([^\]]+)\]="([^"]+)"/g, function(str, attrName, key) {
            dependencies.add(key);
            return '\'+a(c,\''+key+'\',\''+attrName+'\')+\'';
        });

        const fn = new Function('g', 'r', 'a', 'return function(c) { var b=\''+template+'\'; return b }');
        return { fn: fn(get, neon.render, checkAttr), dependencies: [...dependencies], boundDeps: [...biDirectionalDependencies] };
    }

    // TODO: add support for expressions like: <button [disabled]="someVal === 'test'">Test</button>
    // either keep the optimization to only update the component is dependant data changes, or
    // update the component on any change. The latter is easier to implement, but the former is
    // more performant. (how much more performant?)

    // Might need a third party lib to get an expressions AST and then parse it to get the dependencies
    const checkAttr = (obj, key, attrName) => {
        let val = get(obj, key);
        if (val === '' || val === undefined) {
            return '';
        } else {
            return attrName + '="' + val + '"';
        }
    }

    const get = (obj, key) => {
        var i, accessor = key.split('.'), empty = true;
        for (i=0; i<accessor.length; i++) {
            // empty string for key.that.does.not.exist
            if (!obj) return '';
            obj = obj[accessor[i]];
        }
        // empty string for every falsy value except 0
        if (obj === undefined || obj === null || obj === false) return '';
        // treat [] and {} as falsy also
        if (obj instanceof Array && obj.length === 0) return '';
        if (obj.constructor === Object) {
            for (i in obj) if (obj.hasOwnProperty(i)) empty = !i;
            if (empty) return '';
        }
        return obj;
    }
}
