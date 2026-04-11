// Настройки холста — адаптируемся под экран телефона
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Функция для установки размеров под экран
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(window.innerWidth - 48, 450);
    canvas.style.width = `${maxWidth}px`;
    
    // Соотношение сторон 3:4 (вертикальный формат)
    const canvasHeight = maxWidth * 1.33;
    canvas.style.height = `${canvasHeight}px`;
    
    // Реальные размеры для рисования
    canvas.width = 600;
    canvas.height = 800;
}

// Игровые переменные
let gameRunning = true;
let gameOverAnimation = false;
let score = 0;

// Позиции персонажей (адаптированы под вертикальный экран)
let girlX = 150;
let momX = 50;

// Девочка
const girl = {
    x: 150,
    y: 620,
    width: 45,
    height: 60,
    yVelocity: 0,
    isJumping: false,
    gravity: 0.9,
    jumpPower: -14,
    groundY: 620,
    state: 'run'
};

// Препятствия
let obstacles = [];
let obstacleCooldown = 0;

// Анимация
let girlCurrentFrame = 0;
let girlAnimationCounter = 0;
const GIRL_RUN_FRAMES = 4;

// Функция прыжка
function jump() {
    if (!gameRunning || gameOverAnimation) return;
    if (!girl.isJumping && girl.y >= girl.groundY) {
        girl.yVelocity = girl.jumpPower;
        girl.isJumping = true;
        girl.state = 'jump';
        
        // Вибрация на телефоне (если есть)
        if (navigator.vibrate) navigator.vibrate(20);
    }
}

// Сброс игры
function resetGame() {
    gameRunning = true;
    gameOverAnimation = false;
    score = 0;
    momX = 50;
    obstacles = [];
    girl.y = girl.groundY;
    girl.yVelocity = 0;
    girl.isJumping = false;
    girl.state = 'run';
    obstacleCooldown = 10;
    updateUI();
}

function spawnObstacle() {
    obstacles.push({
        x: canvas.width,
        y: 625,
        width: 40,
        height: 45
    });
}

function updateUI() {
    document.getElementById('score').textContent = Math.floor(score);
    let distancePercent = Math.min(100, Math.max(0, ((girl.x - momX - 30) / 120) * 100));
    document.getElementById('distance').textContent = Math.floor(distancePercent);
}

function checkCollisions() {
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (girl.x < obs.x + obs.width &&
            girl.x + girl.width > obs.x &&
            girl.y + girl.height > obs.y &&
            girl.y < obs.y + obs.height) {
            gameRunning = false;
            gameOverAnimation = true;
            girl.state = 'fall';
            if (navigator.vibrate) navigator.vibrate(200);
            return;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Небо с градиентом
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Облака
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(80, 80, 50, 35, 0, 0, Math.PI*2);
    ctx.ellipse(130, 70, 45, 30, 0, 0, Math.PI*2);
    ctx.ellipse(40, 70, 40, 28, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(480, 120, 55, 38, 0, 0, Math.PI*2);
    ctx.ellipse(540, 105, 45, 32, 0, 0, Math.PI*2);
    ctx.ellipse(430, 105, 40, 28, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Земля
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 670, canvas.width, 130);
    ctx.fillStyle = '#6B8E23';
    ctx.fillRect(0, 665, canvas.width, 15);
    
    // Трава
    ctx.fillStyle = '#228B22';
    for(let i = 0; i < 15; i++) {
        ctx.fillRect(i * 45, 655, 3, 15);
    }
    
    // Препятствия
    ctx.fillStyle = '#8B4513';
    for (let obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(obs.x + 8, obs.y - 8, 24, 10);
        ctx.fillStyle = '#8B4513';
    }
    
    // Мама
    if (gameOverAnimation && !gameRunning) {
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(momX, 610, 50, 65);
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(momX + 5, 595, 40, 18);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(momX + 12, 600, 6, 6);
        ctx.fillRect(momX + 28, 600, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(momX + 22, 630, 8, 20);
    } else {
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(momX, 610, 50, 65);
        ctx.fillStyle = '#2C2C2C';
        ctx.fillRect(momX + 5, 595, 40, 18);
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(momX - 12, 625, 20, 8);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(momX + 15, 600, 6, 6);
        ctx.fillRect(momX + 28, 600, 6, 6);
    }
    
    // Девочка
    if (girl.state === 'jump') {
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(girl.x, girl.y, girl.width, girl.height);
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(girl.x + 8, girl.y - 12, 28, 14);
        ctx.fillStyle = '#000';
        ctx.fillRect(girl.x + 32, girl.y + 18, 5, 5);
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(girl.x + 15, girl.y + 38, 15, 7);
    } else if (girl.state === 'fall') {
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(girl.x, girl.y + 15, girl.width, girl.height);
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(girl.x + 8, girl.y + 5, 28, 14);
        ctx.fillStyle = '💧';
    } else {
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(girl.x, girl.y, girl.width, girl.height);
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(girl.x + 8, girl.y - 12, 28, 14);
        ctx.fillStyle = '#000';
        ctx.fillRect(girl.x + 32, girl.y + 18, 5, 5);
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(girl.x + 15, girl.y + 38, 15, 7);
        
        // Анимация бега
        girlAnimationCounter++;
        if (girlAnimationCounter > 8) {
            girlAnimationCounter = 0;
            girlCurrentFrame = (girlCurrentFrame + 1) % 2;
        }
        if (girlCurrentFrame === 1) {
            ctx.fillStyle = '#FF1493';
            ctx.fillRect(girl.x + 5, girl.y + 45, 10, 8);
            ctx.fillRect(girl.x + 28, girl.y + 45, 10, 8);
        }
    }
    
    // Game Over
    if (!gameRunning && !gameOverAnimation) {
        ctx.font = 'bold 40px system-ui';
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 0;
        ctx.fillText('GAME OVER', canvas.width/2 - 120, canvas.height/2 - 50);
        ctx.font = '24px system-ui';
        ctx.fillStyle = '#333';
        ctx.fillText('Мама догнала!', canvas.width/2 - 85, canvas.height/2 + 20);
    }
    
    if (gameOverAnimation) {
        ctx.font = 'bold 28px system-ui';
        ctx.fillStyle = '#FF4500';
        ctx.fillText('🏃‍♀️💨', canvas.width/2 - 40, canvas.height/2 - 80);
    }
}

function updateGame() {
    if (gameOverAnimation) {
        momX += 8;
        let distancePercent = Math.min(100, Math.max(0, ((girl.x - momX - 30) / 120) * 100));
        document.getElementById('distance').textContent = Math.floor(distancePercent);
        
        if (momX + 45 >= girl.x - 10) {
            gameOverAnimation = false;
        }
        draw();
        return;
    }
    
    if (!gameRunning) {
        draw();
        return;
    }
    
    // Физика прыжка
    if (girl.isJumping) {
        girl.yVelocity += girl.gravity;
        girl.y += girl.yVelocity;
        
        if (girl.y >= girl.groundY) {
            girl.y = girl.groundY;
            girl.isJumping = false;
            girl.yVelocity = 0;
            girl.state = 'run';
        }
    }
    
    // Движение препятствий
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= 6;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
    
    // Генерация препятствий
    if (obstacleCooldown <= 0 && gameRunning) {
        if (Math.random() < 0.028) {
            spawnObstacle();
            obstacleCooldown = 50 + Math.random() * 40;
        }
    } else {
        obstacleCooldown--;
    }
    
    score += 0.3;
    checkCollisions();
    updateUI();
    draw();
}

// Обработка касаний в любом месте экрана (кроме кнопки)
function handleTap(e) {
    // Проверяем, не нажата ли кнопка
    let target = e.target;
    if (target.id === 'resetBtn') return;
    if (target.tagName === 'BUTTON') return;
    
    e.preventDefault();
    jump();
}

// События для мобильных и ПК
canvas.addEventListener('touchstart', handleTap, { passive: false });
canvas.addEventListener('mousedown', handleTap);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
    }
});

// Кнопка сброса
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('resetBtn').addEventListener('touchstart', (e) => {
    e.stopPropagation();
    resetGame();
});

// Адаптация под размер экрана
window.addEventListener('resize', () => {
    resizeCanvas();
    resizeCanvas(); // повтор для точности
});
resizeCanvas();

// Инициализация VK
vkBridge.send('VKWebAppInit')
    .then(() => console.log('✅ VK Bridge инициализирован'))
    .catch(err => console.error('❌ Ошибка VK Bridge:', err));

// Запуск
resetGame();
setInterval(updateGame, 1000 / 60);