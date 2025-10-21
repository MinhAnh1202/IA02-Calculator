class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.readyToReset = false; // Dùng để xóa sau khi nhấn =
        this.percentCompleted = false; // Dùng để theo dõi khi hoàn thành phép tính %
        this.history = []; // Lưu trữ lịch sử tính toán
        this.hasError = false; // Đánh dấu khi có lỗi (chia cho 0)
        this.clear();
    }

    // Làm tròn số để tránh lỗi floating point
    roundResult(number) {
        // Làm tròn đến 10 chữ số thập phân để tránh lỗi floating point
        const rounded = Math.round(number * 1e10) / 1e10;
        
        // Nếu là số nguyên, trả về số nguyên
        if (rounded % 1 === 0) {
            return rounded.toString();
        }
        
        // Loại bỏ các số 0 thừa ở cuối
        return rounded.toString().replace(/\.?0+$/, '');
    }

    // Xóa toàn bộ (nút C)
    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.hasError = false; // Reset trạng thái lỗi
        this.percentCompleted = false; // Reset flag
        this.updateDisplay();
        this.updateButtonStates(); // Kích hoạt lại các nút
    }

    // Xóa mục nhập hiện tại (nút CE)
    clearEntry() {
        this.currentOperand = '0';
        this.hasError = false; // Reset trạng thái lỗi
        this.updateDisplay();
        this.updateButtonStates(); // Kích hoạt lại các nút
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
        // Chặn khi có lỗi
        if (this.hasError) return;
        
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
        // Chặn khi có lỗi
        if (this.hasError) return;
        
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
                    this.currentOperand = "Cannot divided by 0";
                    this.previousOperand = '';
                    this.operation = undefined;
                    this.hasError = true;
                    this.updateDisplay();
                    this.updateButtonStates();
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        this.currentOperand = this.roundResult(computation);
        this.operation = undefined;
        this.previousOperand = fullExpression; // Hiển thị phép tính hoàn chỉnh
        this.percentCompleted = false; // Reset flag
        this.readyToReset = true; // Sẵn sàng reset ở lần nhập số tiếp theo
        
        // Lưu vào lịch sử
        this.addToHistory(fullExpression.replace(' =', '') + ' =', computation.toString());
    }

    // Xử lý các phép toán 1-toán-hạng (√, %, ±, ...)
    handleAction(action) {
        // Chặn khi có lỗi (trừ clear và clear-entry)
        if (this.hasError && action !== 'clear' && action !== 'clear-entry') return;
        
        const current = parseFloat(this.currentOperand);
        if (isNaN(current) && action !== 'percent') return; // % có thể hoạt động khác

        let computation;
        let historyExpression = '';

        switch (action) {
            case 'negate': // Nút ±
                computation = this.roundResult(current * -1);
                historyExpression = `negate(${this.currentOperand})`;
                this.previousOperand = historyExpression;
                this.operation = undefined;
                this.readyToReset = true;
                break;
            case 'sqrt': // Nút √
                if (current < 0) {
                    this.currentOperand = "Invalid input";
                    this.previousOperand = '';
                    this.operation = undefined;
                    this.hasError = true;
                    this.updateDisplay();
                    this.updateButtonStates();
                    return;
                }
                computation = this.roundResult(Math.sqrt(current));
                historyExpression = `√(${this.currentOperand})`;
                this.previousOperand = historyExpression;
                this.operation = undefined;
                this.readyToReset = true;
                break;
            case 'percent': // Nút %
                // Logic % của Windows: khi có phép toán đang chờ, % tính theo số trước đó
                if (this.previousOperand !== '' && this.operation) {
                    const prev = parseFloat(this.previousOperand);
                    computation = this.roundResult(prev * (current / 100));
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
                    computation = this.roundResult(current / 100);
                    historyExpression = `${this.currentOperand}%`;
                    this.previousOperand = historyExpression;
                    this.operation = undefined;
                    this.readyToReset = true;
                }
                break;
            // Các nút 1/x và x² từ giao diện HTML
            case 'inverse': // 1/x
                if (current === 0) {
                    this.currentOperand = "Cannot divided by 0";
                    this.previousOperand = '';
                    this.operation = undefined;
                    this.hasError = true;
                    this.updateDisplay();
                    this.updateButtonStates();
                    return;
                }
                computation = this.roundResult(1 / current);
                historyExpression = `1/(${this.currentOperand})`;
                this.previousOperand = historyExpression;
                this.operation = undefined;
                this.readyToReset = true;
                break;
            case 'square': // x²
                computation = this.roundResult(current * current);
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
        
        // Thêm/xóa class error cho current operand
        if (this.hasError) {
            this.currentOperandTextElement.classList.add('error');
        } else {
            this.currentOperandTextElement.classList.remove('error');
        }
        
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

    // Thêm vào lịch sử
    addToHistory(expression, result) {
        const historyItem = {
            expression: expression,
            result: result,
            timestamp: new Date()
        };
        this.history.unshift(historyItem); // Thêm vào đầu mảng
        
        // Giới hạn lịch sử tối đa 50 item
        if (this.history.length > 50) {
            this.history.pop();
        }
        
        // Lưu vào localStorage
        this.saveHistoryToStorage();
    }

    // Lưu lịch sử vào localStorage
    saveHistoryToStorage() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
    }

    // Tải lịch sử từ localStorage
    loadHistoryFromStorage() {
        const saved = localStorage.getItem('calculatorHistory');
        if (saved) {
            this.history = JSON.parse(saved);
        }
    }

    // Xóa toàn bộ lịch sử
    clearHistory() {
        this.history = [];
        this.saveHistoryToStorage();
        this.updateHistoryDisplay();
    }

    // Cập nhật hiển thị lịch sử
    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        const clearButton = document.getElementById('clearHistory');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="no-history">Chưa có lịch sử</div>';
            clearButton.disabled = true;
        } else {
            historyList.innerHTML = '';
            clearButton.disabled = false;
            
            this.history.forEach((item, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="history-expression">${item.expression}</div>
                    <div class="history-result">${item.result}</div>
                `;
                
                // Click để sử dụng lại kết quả
                historyItem.addEventListener('click', () => {
                    this.currentOperand = item.result;
                    this.previousOperand = '';
                    this.operation = undefined;
                    this.readyToReset = true;
                    this.updateDisplay();
                    this.closeHistoryModal();
                });
                
                historyList.appendChild(historyItem);
            });
        }
    }

    // Mở modal lịch sử
    openHistoryModal() {
        this.loadHistoryFromStorage();
        this.updateHistoryDisplay();
        document.getElementById('historyModal').style.display = 'block';
    }

    // Đóng modal lịch sử
    closeHistoryModal() {
        document.getElementById('historyModal').style.display = 'none';
    }

    // Cập nhật trạng thái disabled của các nút
    updateButtonStates() {
        const operatorButtons = document.querySelectorAll('[data-operation]');
        const actionButtons = document.querySelectorAll('[data-action]');
        
        operatorButtons.forEach(button => {
            button.disabled = this.hasError;
        });
        
        actionButtons.forEach(button => {
            const action = button.dataset.action;
            // Chỉ disable các action này khi có lỗi, giữ lại C, CE
            if (action !== 'clear' && action !== 'clear-entry') {
                button.disabled = this.hasError;
            }
        });
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
        // Nếu có lỗi, reset toàn bộ và chỉ hiển thị số được ấn
        if (calculator.hasError) {
            calculator.currentOperand = button.innerText;
            calculator.previousOperand = '';
            calculator.operation = undefined;
            calculator.hasError = false;
            calculator.percentCompleted = false;
            calculator.readyToReset = false;
            calculator.updateDisplay();
            calculator.updateButtonStates(); // Kích hoạt lại các nút
            return;
        }
        
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
            case 'history':
                calculator.openHistoryModal();
                break;
            default:
                // Các hành động 1-toán-hạng (%, √, ±, 1/x, x²)
                calculator.handleAction(action);
        }
    });
});

// Event listeners cho modal lịch sử
document.getElementById('closeHistory').addEventListener('click', () => {
    calculator.closeHistoryModal();
});

document.getElementById('clearHistory').addEventListener('click', () => {
    calculator.clearHistory();
});

// Đóng modal khi click bên ngoài
document.getElementById('historyModal').addEventListener('click', (e) => {
    if (e.target.id === 'historyModal') {
        calculator.closeHistoryModal();
    }
});

// Tải lịch sử khi khởi động
calculator.loadHistoryFromStorage();
