document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentQuestion = 0;
    let answers = {};
    let questions = [];
    let primaryColor = getRandomColor();
    let secondaryColor = getRandomColor();
    
    // Cargar configuración desde XML
    loadSurveyConfig();
    
    // Configurar estilos dinámicos
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    
    // Event listeners
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('prev-btn').addEventListener('click', prevQuestion);
    document.getElementById('submit-btn').addEventListener('click', submitSurvey);
    
    // Función para cargar la configuración del XML
    function loadSurveyConfig() {
        fetch('config.xml')
            .then(response => response.text())
            .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
            .then(data => {
                // Configurar título
                const title = data.querySelector('title').textContent;
                document.querySelector('.survey-title').textContent = title;
                
                // Cargar preguntas
                const questionNodes = data.querySelectorAll('questions question');
                questions = Array.from(questionNodes).map(q => {
                    return {
                        text: q.querySelector('text').textContent,
                        type: q.getAttribute('type'),
                        required: q.getAttribute('required') === 'true',
                        options: q.querySelector('options') ? 
                            Array.from(q.querySelectorAll('options option')).map(o => o.textContent) : 
                            null
                    };
                });
                
                // Inicializar encuesta
                showQuestion(currentQuestion);
                updateProgressBar();
            });
    }
    
    // Mostrar pregunta actual
    function showQuestion(index) {
        const questionContainer = document.querySelector('.question-container');
        questionContainer.innerHTML = '';
        
        if (index >= questions.length) {
            return;
        }
        
        const question = questions[index];
        let questionHTML = '';
        
        questionHTML += `<div class="question animate-in">`;
        questionHTML += `<h2>${question.text}</h2>`;
        
        if (question.type === 'multiple-choice' || question.type === 'scale') {
            question.options.forEach((option, i) => {
                questionHTML += `
                    <div class="option">
                        <input type="radio" id="q${index}_opt${i}" name="q${index}" value="${option}">
                        <label for="q${index}_opt${i}">${option}</label>
                    </div>
                `;
            });
        } else if (question.type === 'text') {
            questionHTML += `
                <textarea id="q${index}_text" rows="4" placeholder="Escribe tu respuesta aquí..."></textarea>
            `;
        }
        
        questionHTML += `</div>`;
        questionContainer.innerHTML = questionHTML;
        
        // Cargar respuesta previa si existe
        if (answers[`q${index}`]) {
            if (question.type === 'text') {
                document.getElementById(`q${index}_text`).value = answers[`q${index}`];
            } else {
                const options = document.querySelectorAll(`input[name="q${index}"]`);
                options.forEach(opt => {
                    if (opt.value === answers[`q${index}`]) {
                        opt.checked = true;
                    }
                });
            }
        }
        
        // Actualizar botones de navegación
        updateNavButtons();
    }
    
    // Función para avanzar a la siguiente pregunta
    function nextQuestion() {
        if (!validateQuestion(currentQuestion)) return;
        
        saveAnswer(currentQuestion);
        currentQuestion++;
        
        if (currentQuestion < questions.length) {
            showQuestion(currentQuestion);
            updateProgressBar();
        } else {
            prepareSubmit();
        }
    }
    
    // Función para retroceder a la pregunta anterior
    function prevQuestion() {
        currentQuestion--;
        showQuestion(currentQuestion);
        updateProgressBar();
    }
    
    // Guardar respuesta actual
    function saveAnswer(index) {
        const question = questions[index];
        
        if (question.type === 'text') {
            const answer = document.getElementById(`q${index}_text`).value;
            answers[`q${index}`] = answer;
        } else {
            const selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
            if (selectedOption) {
                answers[`q${index}`] = selectedOption.value;
            }
        }
    }
    
    // Validar pregunta actual
    function validateQuestion(index) {
        const question = questions[index];
        
        if (!question.required) return true;
        
        if (question.type === 'text') {
            const answer = document.getElementById(`q${index}_text`).value.trim();
            if (answer === '') {
                alert('Por favor responde esta pregunta.');
                return false;
            }
        } else {
            const selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
            if (!selectedOption) {
                alert('Por favor selecciona una opción.');
                return false;
            }
        }
        
        return true;
    }
    
    // Actualizar barra de progreso
    function updateProgressBar() {
        const progress = (currentQuestion / questions.length) * 100;
        document.querySelector('.progress').style.width = `${progress}%`;
    }
    
    // Actualizar botones de navegación
    function updateNavButtons() {
        document.getElementById('prev-btn').disabled = currentQuestion === 0;
        document.getElementById('next-btn').style.display = currentQuestion < questions.length - 1 ? 'block' : 'none';
        document.getElementById('submit-btn').style.display = currentQuestion === questions.length - 1 ? 'block' : 'none';
    }
    
    // Preparar envío
    function prepareSubmit() {
        document.querySelector('.survey-content').classList.add('hidden');
        document.querySelector('.thank-you-message').classList.add('show');
    }
    
    // Enviar encuesta
    function submitSurvey() {
        if (!validateQuestion(currentQuestion)) return;
        
        saveAnswer(currentQuestion);
        
        // Preparar datos para enviar
        const dataToSend = {
            token: 'TU_TOKEN_DE_SEGURIDAD', // Cambiar por tu token
            answers: answers,
            timestamp: new Date().toISOString()
        };
        
        // Enviar a Google Sheets via Apps Script
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbym9EZ0xDS8OatVpllb-M824k4v4V4z6Yg6z-Gyjh6ezUh3SsLPIkB6Ax6jOZSEoO162Q/exec'; // Reemplazar con tu URL
        
        axios.post(scriptUrl, dataToSend)
            .then(response => {
                prepareSubmit();
            })
            .catch(error => {
                console.error('Error al enviar:', error);
                alert('Hubo un error al enviar tus respuestas. Por favor intenta nuevamente.');
            });
    }
    
    // Generar color aleatorio
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 50%)`;
    }
});
