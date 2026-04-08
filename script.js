(() => {
  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');

  let expression = '';
  let lastResult = null;
  let justEvaluated = false;

  function updateDisplay() {
    expressionEl.textContent = expression || '';
    resultEl.classList.remove('error');
  }

  function showResult(value) {
    if (typeof value === 'number') {
      if (!isFinite(value)) {
        resultEl.textContent = value === Infinity ? 'Infinity' : '-Infinity';
      } else {
        const formatted = parseFloat(value.toPrecision(12));
        resultEl.textContent = formatted.toString();
      }
    } else {
      resultEl.textContent = value;
    }
  }

  function showError(msg) {
    resultEl.textContent = msg || 'Error';
    resultEl.classList.add('error');
  }

  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function evaluate(expr) {
    let e = expr;

    // Replace ^ with ** for exponentiation
    e = e.replace(/\^/g, '**');

    // Replace percent
    e = e.replace(/%/g, '*0.01');

    // Replace scientific functions BEFORE constants
    e = e.replace(/sin\(/g, '__SIN__(');
    e = e.replace(/cos\(/g, '__COS__(');
    e = e.replace(/tan\(/g, '__TAN__(');
    e = e.replace(/sqrt\(/g, '__SQRT__(');
    e = e.replace(/ln\(/g, '__LN__(');
    e = e.replace(/log\(/g, '__LOG10__(');

    // Replace constants
    e = e.replace(/\u03c0/g, `(${Math.PI})`);
    e = e.replace(/(?<![a-zA-Z0-9.])e(?![a-zA-Z0-9])/g, `(${Math.E})`);

    // Now replace placeholders with Math functions
    e = e.replace(/__SIN__\(/g, 'Math.sin(');
    e = e.replace(/__COS__\(/g, 'Math.cos(');
    e = e.replace(/__TAN__\(/g, 'Math.tan(');
    e = e.replace(/__LN__\(/g, 'Math.log(');
    e = e.replace(/__LOG10__\(/g, 'Math.log10(');
    e = e.replace(/__SQRT__\(/g, 'Math.sqrt(');

    // Handle factorial
    e = e.replace(/([\d.]+)!/g, 'factorial($1)');

    // Auto-close unclosed parens
    const open = (e.match(/\(/g) || []).length;
    const close = (e.match(/\)/g) || []).length;
    for (let i = 0; i < open - close; i++) e += ')';

    const result = Function('factorial', `"use strict"; return (${e})`)(factorial);

    if (typeof result !== 'number' || isNaN(result)) {
      throw new Error('Invalid result');
    }
    return result;
  }

  function appendToExpression(value) {
    if (justEvaluated) {
      if (/[0-9.(]/.test(value) || ['sin(', 'cos(', 'tan(', 'ln(', 'log(', 'sqrt('].includes(value)) {
        expression = '';
      } else if (lastResult !== null) {
        expression = lastResult.toString();
      }
      justEvaluated = false;
    }
    expression += value;
    updateDisplay();
  }

  function handleAction(action) {
    switch (action) {
      case 'clear':
        expression = '';
        lastResult = null;
        justEvaluated = false;
        showResult('0');
        updateDisplay();
        break;

      case 'delete':
        if (justEvaluated) {
          expression = '';
          justEvaluated = false;
          showResult('0');
        } else {
          const funcMatch = expression.match(/(sin|cos|tan|ln|log|sqrt)\($/);
          if (funcMatch) {
            expression = expression.slice(0, -funcMatch[0].length);
          } else {
            expression = expression.slice(0, -1);
          }
        }
        updateDisplay();
        break;

      case '=':
        if (!expression) return;
        try {
          const result = evaluate(expression);
          expressionEl.textContent = expression;
          showResult(result);
          lastResult = result;
          justEvaluated = true;
        } catch {
          showError('Error');
        }
        break;

      case 'sin': appendToExpression('sin('); break;
      case 'cos': appendToExpression('cos('); break;
      case 'tan': appendToExpression('tan('); break;
      case 'ln': appendToExpression('ln('); break;
      case 'log': appendToExpression('log('); break;
      case 'sqrt': appendToExpression('sqrt('); break;
      case 'power': appendToExpression('^'); break;
      case 'square': appendToExpression('^2'); break;

      case 'reciprocal':
        if (justEvaluated && lastResult !== null) {
          const r = 1 / lastResult;
          expression = `1/(${lastResult})`;
          showResult(r);
          lastResult = r;
          justEvaluated = true;
          updateDisplay();
        } else {
          appendToExpression('1/(');
        }
        break;

      case 'pi': appendToExpression('\u03c0'); break;
      case 'e': appendToExpression('e'); break;
      case 'factorial': appendToExpression('!'); break;

      case 'negate':
        if (justEvaluated && lastResult !== null) {
          lastResult = -lastResult;
          expression = `(${lastResult})`;
          showResult(lastResult);
          updateDisplay();
        } else if (expression) {
          expression = `(-(${expression}))`;
          updateDisplay();
        }
        break;

      default:
        appendToExpression(action);
        break;
    }
  }

  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });

  document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (/^[0-9.]$/.test(key)) handleAction(key);
    else if (key === '+') handleAction('+');
    else if (key === '-') handleAction('-');
    else if (key === '*') handleAction('*');
    else if (key === '/') { e.preventDefault(); handleAction('/'); }
    else if (key === '(' || key === ')') handleAction(key);
    else if (key === '%') handleAction('%');
    else if (key === 'Enter' || key === '=') handleAction('=');
    else if (key === 'Backspace') handleAction('delete');
    else if (key === 'Escape') handleAction('clear');
    else if (key === '^') handleAction('power');
  });
})();
