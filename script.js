class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.readyToReset = false; // Dùng để xóa sau khi nhấn =
        this.percentCompleted = false; // Dùng để theo dõi khi hoàn thành phép tính %
        this.clear();
    }

    // Xóa toàn bộ (nút C)
    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.updateDisplay();
    }

    // Xóa mục nhập hiện tại (nút CE)
    clearEntry() {
        this.currentOperand = '0';
        this.updateDisplay();
    }

    // Xóa ký tự cuối (nút ←)
    deleteLast() {
        if (this.currentOperand.length === 1 && this.currentOperand === '0') return;
        if (this.currentOperand.length === 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.toString().slice(0, -1);
        }
        this.updateDisplay();
    }

    // Thêm số hoặc dấu chấm
    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    // Chọn một phép toán
    chooseOperation(operation) {
        if (this.currentOperand === '' && this.previousOperand === '') return;
        
        // Nếu vừa hoàn thành một phép tính (có dấu =), bắt đầu phép tính mới
        if (this.readyToReset) {
            this.previousOperand = this.currentOperand;
            this.currentOperand = '';
            this.operation = operation;
            this.readyToReset = false;
            this.updateDisplay();
            return;
        }
        
        // Nếu có phép toán đang chờ, tính toán trước
        if (this.previousOperand !== '' && this.operation) {
            this.compute();
        }

        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = ''; // Windows 11 không hiển thị '0' ngay
        this.updateDisplay();
    }

    // Thực hiện tính toán (nút =)
    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand.split(/[+\−×÷]/)[0] || this.previousOperand);
        const current = parseFloat(this.currentOperand);

        if (isNaN(prev) || isNaN(current)) return;

        // Nếu đã hoàn thành phép tính %, sử dụng expression có sẵn
        let fullExpression;
        if (this.percentCompleted) {
            fullExpression = `${this.previousOperand} =`;
        } else {
            // Lưu lại phép tính để hiển thị
            fullExpression = `${this.previousOperand || prev} ${this.operation} ${this.currentOperand} =`;
        }

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '−': // Sử dụng ký tự trừ chuẩn
                computation = prev - current;
                break;
            case '×': // Sử dụng ký tự nhân chuẩn
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    alert("Không thể chia cho 0");
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = fullExpression; // Hiển thị phép tính hoàn chỉnh
        this.percentCompleted = false; // Reset flag
        this.readyToReset = true; // Sẵn sàng reset ở lần nhập số tiếp theo
    }

    // Xử lý các phép toán 1-toán-hạng (√, %, ±, ...)
    handleAction(action) {
        const current = parseFloat(this.currentOperand);
        if (isNaN(current) && action !== 'percent') return; // % có thể hoạt động khác

        let computation;
        let historyExpression = '';

        switch (action) {
            case 'negate': // Nút ±
                computation = (current * -1).toString();
                historyExpression = `negate(${this.currentOperand})`;
                this.previousOperand = historyExpression;
                this.operation = undefined;
                this.readyToReset = true;
                break;
            case 'sqrt': // Nút √
                if (current < 0) {
                    alert("Đầu vào không hợp lệ cho căn bậc hai");
                    return;
                }
                computation = Math.sqrt(current).toString();
                historyExpression = `√(${this.currentOperand})`;
                this.previousOperand = historyExpression;
                this.operation = undefined;
                this.readyToReset = true;
                break;
            case 'percent': // Nút %
                // Logic % của Windows: khi có phép toán đang chờ, % tính theo số trước đó
                if (this.previousOperand !== '' && this.operation) {
                    const prev = parseFloat(this.previousOperand);
                    computation = (prev * (current / 100)).toString();
                    // Cập nhật previousOperand để hiển thị phép tính với giá trị %
                    const operationSymbol = this.operation === '−' ? '−' : 
                                          this.operation === '×' ? '×' : 
                                          this.operation === '÷' ? '÷' : 
                                          this.operation;
                    this.previousOperand = `${prev}${operationSymbol}${computation}`;
                    // Đánh dấu là đã hoàn thành phép tính % để không hiển thị operation ở updateDisplay
                    this.percentCompleted = true;
                    // Không xóa operation vì vẫn cần để tính toán khi ấn =
                } else {
                    // Nếu không có phép toán trước đó, % = current/100
                    computation = (current / 100).toString();
                    historyExpression = `${this.currentOperand}%`;
                    this.previousOperand = historyExpression;
                    this.operation = undefined;
                    this.readyToReset = true;
                }
                break;
            // Các nút 1/x và x² từ giao diện HTML
            case 'inverse': // 1/x
                if (current === 0) {
                     alert("Không thể chia cho 0");
                    return;
                }
                computation = (1 / current).toString();
                historyExpression = `1/(${this.currentOperand})`;
                this.previousOperand = historyExpression;
                this.operation = undefined;
                this.readyToReset = true;
                break;
            case 'square': // x²
                computation = (current * current).toString();
                historyExpression = `sqr(${this.currentOperand})`;
                this.previousOperand = historyExpression;
                this.operation = undefined;
                this.readyToReset = true;
                break;
        }

        // Cập nhật kết quả
        this.currentOperand = computation;
        this.updateDisplay();
    }

    // Cập nhật giao diện
    updateDisplay() {
        this.currentOperandTextElement.innerText = this.currentOperand || '0';
        if (this.operation != null && !this.percentCompleted) {
            this.previousOperandTextElement.innerText = 
                `${this.previousOperand} ${this.operation === 'subtract' ? '−' : 
                                       this.operation === 'multiply' ? '×' : 
                                       this.operation === 'divide' ? '÷' : 
                                       this.operation}`;
        } else {
            // Nếu previousOperand chứa dấu = hoặc đã hoàn thành %, hiển thị nguyên chuỗi
            this.previousOperandTextElement.innerText = this.previousOperand;
        }
    }
}

// --- Khởi tạo và gắn kết DOM ---

const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operation]');
const actionButtons = document.querySelectorAll('[data-action]');
const previousOperandTextElement = document.querySelector('.previous-operand');
const currentOperandTextElement = document.querySelector('.current-operand');

const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Nếu vừa nhấn =, lần nhấn số tiếp theo sẽ xóa kết quả cũ
        if (calculator.readyToReset) {
            calculator.currentOperand = '0'; // Bắt đầu lại từ 0
            calculator.readyToReset = false;
        }
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
    });
});

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.readyToReset = false; // Tắt cờ reset nếu chọn phép toán
        calculator.chooseOperation(button.dataset.operation === 'subtract' ? '−' :
                                  button.dataset.operation === 'multiply' ? '×' :
                                  button.dataset.operation === 'divide' ? '÷' :
                                  button.innerText);
    });
});

actionButtons.forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        switch (action) {
            case 'equals':
                calculator.compute();
                calculator.updateDisplay();
                break;
            case 'clear':
                calculator.clear();
                break;
            case 'clear-entry':
                calculator.clearEntry();
                break;
            case 'backspace':
                calculator.deleteLast();
                break;
            default:
                // Các hành động 1-toán-hạng (%, √, ±, 1/x, x²)
                calculator.handleAction(action);
        }
    });
});