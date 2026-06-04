// index.js (fixed)
// elements
const display = document.querySelector("input");
const buttons = document.querySelectorAll(".btns button");


// state
let currentValue = "0";
let previousValue = null;
let operator = null;
let justCalculated = false;
let waitingForNewValue = false; // <-- important flag

// display helper
function updateDisplay() {
  display.value = currentValue;
  display.classList.remove("display-update");
  requestAnimationFrame(() => display.classList.add("display-update"));
}
updateDisplay();

function pressButton(button) {
  button.classList.add("is-pressed");
  setTimeout(() => button.classList.remove("is-pressed"), 120);
  button.click();
}

// button handling
buttons.forEach(button => {
  button.addEventListener("click", () => {
    const value = button.innerText;

    // All Clear
    if (value === "AC") {
      currentValue = "0";
      previousValue = null;
      operator = null;
      justCalculated = false;
      waitingForNewValue = false;
      updateDisplay();
      return;
    }

        // Backspace
    if (value === "⌫") {
      if (currentValue === "Error") {
        currentValue = "0";
      } else if (currentValue.length > 1) {
        currentValue = currentValue.slice(0, -1);
      } else {
        currentValue = "0";
      }
      updateDisplay();
      return;
    }


    // Decimal point
    if (value === ".") {
      if (waitingForNewValue || justCalculated) {
        currentValue = "0.";
        waitingForNewValue = false;
        justCalculated = false;
      } else if (!currentValue.includes(".")) {
        currentValue += ".";
      }
      updateDisplay();
      return;
    }

    // Number keys
    if (!isNaN(value)) {
      // If we're waiting for a new number (after an operator) or we've just calculated,
      // replace the display instead of appending.
      if (waitingForNewValue || currentValue === "0" || justCalculated) {
        currentValue = value;
        waitingForNewValue = false;
        justCalculated = false;
      } else {
        currentValue += value;
      }
      updateDisplay();
      return;
    }

    // Percent button: two behaviours
    if (value === "%") {
      if (previousValue !== null && operator !== null && !waitingForNewValue) {
        // contextual percent: 50 + 10% => 50 + (50 * 10 / 100)
        currentValue = String(parseFloat(previousValue) * (parseFloat(currentValue) / 100));
      } else {
        // standalone percent: 50% => 0.5
        currentValue = String(parseFloat(currentValue) / 100);
      }
      updateDisplay();
      return;
    }

    // Operators (+ - * /) and their Unicode variants (+ − × ÷)
    if (["+", "-", "*", "/", "−", "×", "÷"].includes(value)) {
      // Map Unicode operators to standard operators
      const operatorMap = {
        "−": "-",
        "×": "*",
        "÷": "/"
      };
      const standardOp = operatorMap[value] ?? value;
      
      // If there's a pending operator and the user already entered the next number,
      // compute the pending result first (allows chaining).
      if (operator && !waitingForNewValue) {
        calculate();
      }
      // store the operator and mark that we are waiting for the next number
      operator = standardOp;
      previousValue = currentValue;
      waitingForNewValue = true;
      justCalculated = false;
      return;
    }

    // Equals
    if (value === "=") {
      if (operator && previousValue !== null) {
        calculate();
        operator = null;
        previousValue = null;
        justCalculated = true;
        waitingForNewValue = true;
        updateDisplay();
      }
      return;
    }
  });
});

const keyToButtonValue = {
  Enter: "=",
  "=": "=",
  Escape: "AC",
  Backspace: "⌫",
  Delete: "AC",
  "/": "÷",
  "*": "×",
  "-": "−",
  "+": "+",
  "%": "%",
  ".": ".",
};

document.addEventListener("keydown", (event) => {
  const key = event.key;
  const buttonValue = keyToButtonValue[key] ?? (/^\d$/.test(key) ? key : null);

  if (!buttonValue) {
    return;
  }

  const targetButton = Array.from(buttons).find(
    (button) => button.innerText.trim() === buttonValue
  );

  if (!targetButton) {
    return;
  }

  event.preventDefault();
  pressButton(targetButton);
});

// calculate helper
function calculate() {
  const prev = parseFloat(previousValue);
  const curr = parseFloat(currentValue);
  let result;

  switch (operator) {
    case "+":
      result = prev + curr;
      break;
    case "-":
      result = prev - curr;
      break;
    case "*":
      result = prev * curr;
      break;
    case "/":
      if (curr === 0) {
        currentValue = "Error";
        previousValue = null;
        operator = null;
        waitingForNewValue = true;
        updateDisplay();
        return;
      }
      result = prev / curr;
      break;
    default:
      return;
  }

  // remove floating-point noise and keep reasonable precision
  result = +result.toFixed(10);
  currentValue = String(result);
  updateDisplay();

  // keep the result as previousValue so chaining like "2 + 3 + 4" works smoothly
  previousValue = currentValue;
}
