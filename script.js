// Настройки холста
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Размеры
canvas.width = 800;
canvas.height = 400;

// Игровые переменные
let gameRunning = true;
let score = 0;
let frame = 0;
let distanceToMom = 100; // 100% - мама далеко, 0% - догнала

// Девочка
const girl = {
    x: 100,
    y: 300,
    width: 30,
    height: 40,
    yVelocity: 0,
    isJumping: false,
    gravity: 0.8,
    jumpPower: -12,
    groundY: 330
};

// Препятствия
let obstacles = [];

// Мама (погоня)
let momX = 600; // позиция мамы на дороге

// Счётчик кадров для генерации препятствий
let obstacleCooldown = 0;

// Функция прыжка
function jump() {
    if (!gameRunning) return;
    if (!girl.isJumping && girl.y >= girl.groundY) {
        girl.yVelocity = girl.jumpPower;
        girl.isJumping = true;
    }
}

// Сброс игры
function resetGame() {
    gameRunning = true;
    score = 0;
    frame = 0;
    distanceToMom = 100;
    momX = 600;
    obstacles = [];
    girl.y = girl.groundY;
    girl.yVelocity = 0;
    girl.isJumping = false;
    obstacleCooldown = 10;
    updateUI();
}

// Создание препятствия
function spawnObstacle() {
    obstacles.push({
        x: canvas.width,
        y: 335,
        width: 20,
        height: 25,
        type: 'obstacle'
    });
}

// Обновление UI
function updateUI() {
    document.getElementById('score').textContent = Math.floor(score);
    document.getElementById('distance').textContent = Math.max(0, Math.floor(distanceToMom));
}

// Проверка столкновений
function checkCollisions() {
    // Проверка столкновения девочки с препятствиями
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (girl.x < obs.x + obs.width &&
            girl.x + girl.width > obs.x &&
            girl.y + girl.height > obs.y &&
            girl.y < obs.y + obs.height) {
            // Столкновение с препятствием - девочка споткнулась
            gameRunning = false;
            return;
        }
    }
    
    // Проверка, догнала ли мама (расстояние <= 0)
    if (distanceToMom <= 0) {
        gameRunning = false;
    }
}

// Отрисовка всего
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Земля
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 360, canvas.width, 40);
    ctx.fillStyle = '#6B8E23';
    ctx.fillRect(0, 355, canvas.width, 10);
    
    // Девочка
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(girl.x, girl.y, girl.width, girl.height);
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(girl.x + 5, girl.y - 10, 20, 10); // волосы
    ctx.fillStyle = '#000';
    ctx.fillRect(girl.x + 22, girl.y + 10, 4, 4); // глаз
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(girl.x + 10, girl.y + 25, 10, 5); // карман
    
    // Препятствия
    ctx.fillStyle = '#8B4513';
    for (let obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(obs.x + 3, obs.y - 5, 14, 5);
        ctx.fillStyle = '#8B4513';
    }
    
    // Мама с ремнём
    const momDrawX = canvas.width - (canvas.width * (distanceToMom / 100));
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(momDrawX, 320, 35, 45);
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(momDrawX + 5, 310, 25, 12); // голова
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(momDrawX - 10, 330, 15, 5); // ремень
    ctx.fillStyle = '#FFF';
    ctx.fillRect(momDrawX + 12, 315, 4, 4);
    ctx.fillRect(momDrawX + 20, 315, 4, 4);
    
    // Текст "Game Over"
    if (!gameRunning) {
        ctx.font = 'bold 32px system-ui';
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 0;
        ctx.fillText('GAME OVER', canvas.width/2 - 100, canvas.height/2);
        ctx.font = '20px system-ui';
        ctx.fillStyle = '#333';
        ctx.fillText('Мама догнала!', canvas.width/2 - 70, canvas.height/2 + 50);
    }
    
    // Облачка
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(100, 50, 40, 30, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(600, 70, 50, 35, 0, 0, Math.PI*2);
    ctx.fill();
}

// Основной игровой цикл
function updateGame() {
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
        }
    }
    
    // Движение препятствий
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= 5;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
    
    // Генерация препятствий
    if (obstacleCooldown <= 0 && gameRunning) {
        if (Math.random() < 0.02) { // 2% шанс каждый кадр
            spawnObstacle();
            obstacleCooldown = 40 + Math.random() * 30;
        }
    } else {
        obstacleCooldown--;
    }
    
    // Мама приближается (чем дальше забежала, тем быстрее)
    const momSpeed = 0.08 + (score / 2000);
    distanceToMom -= momSpeed;
    if (distanceToMom < 0) distanceToMom = 0;
    
    // Начисление очков за выживание
    score += 0.2;
    
    // Проверка столкновений
    checkCollisions();
    
    // Обновление UI
    updateUI();
    
    // Отрисовка
    draw();
}

// Управление
function handleJump(e) {
    if (e.type === 'keydown') {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            jump();
        }
    } else if (e.type === 'click' || e.type === 'touchstart') {
        e.preventDefault();
        jump();
    }
}

// Кнопка сброса
document.getElementById('resetBtn').addEventListener('click', () => {
    resetGame();
});

// События прыжка
window.addEventListener('keydown', handleJump);
canvas.addEventListener('click', handleJump);
canvas.addEventListener('touchstart', handleJump);

// Инициализация VK Bridge
vkBridge.send('VKWebAppInit')
    .then(() => console.log('✅ VK Bridge инициализирован'))
    .catch(err => console.error('❌ Ошибка VK Bridge:', err));

// Запуск игры
resetGame();
setInterval(updateGame, 1000 / 60); // 60 FPS