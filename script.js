// Настройки холста
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Размеры
canvas.width = 800;
canvas.height = 400;

// Игровые переменные
let gameRunning = true;
let gameOverAnimation = false; // Режим анимации проигрыша
let score = 0;

// Позиции персонажей
let girlX = 150;
let momX = 50;

// Девочка (прыжки)
const girl = {
    x: 150,
    y: 330,
    width: 30,
    height: 40,
    yVelocity: 0,
    isJumping: false,
    gravity: 0.8,
    jumpPower: -11,
    groundY: 330
};

// Препятствия
let obstacles = [];
let obstacleCooldown = 0;

// Функция прыжка
function jump() {
    if (!gameRunning || gameOverAnimation) return;
    if (!girl.isJumping && girl.y >= girl.groundY) {
        girl.yVelocity = girl.jumpPower;
        girl.isJumping = true;
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
    obstacleCooldown = 10;
    updateUI();
}

// Создание препятствия
function spawnObstacle() {
    obstacles.push({
        x: canvas.width,
        y: 335,
        width: 20,
        height: 25
    });
}

// Обновление UI
function updateUI() {
    document.getElementById('score').textContent = Math.floor(score);
    let distancePercent = Math.min(100, Math.max(0, ((girl.x - momX - 30) / 120) * 100));
    document.getElementById('distance').textContent = Math.floor(distancePercent);
}

// Проверка столкновений (только с препятствиями)
function checkCollisions() {
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (girl.x < obs.x + obs.width &&
            girl.x + girl.width > obs.x &&
            girl.y + girl.height > obs.y &&
            girl.y < obs.y + obs.height) {
            // Настик споткнулась! Запускаем анимацию погони
            gameRunning = false;
            gameOverAnimation = true;
            return;
        }
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
    
    // Препятствия
    ctx.fillStyle = '#8B4513';
    for (let obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(obs.x + 3, obs.y - 5, 14, 5);
        ctx.fillStyle = '#8B4513';
    }
    
    // Мама с ремнём
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(momX, 320, 35, 45);
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(momX + 5, 310, 25, 12);
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(momX - 10, 330, 15, 5);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(momX + 12, 315, 4, 4);
    ctx.fillRect(momX + 20, 315, 4, 4);
    
    // Девочка (если не в анимации проигрыша, может слегка наклониться)
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(girl.x, girl.y, girl.width, girl.height);
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(girl.x + 5, girl.y - 10, 20, 10);
    ctx.fillStyle = '#000';
    ctx.fillRect(girl.x + 22, girl.y + 10, 4, 4);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(girl.x + 10, girl.y + 25, 10, 5);
    
    // Если игра окончена и анимация завершена — показываем текст
    if (!gameRunning && !gameOverAnimation) {
        ctx.font = 'bold 32px system-ui';
        ctx.fillStyle = '#FF0000';
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
    // Режим анимации проигрыша (мама бежит к девочке)
    if (gameOverAnimation) {
        // Мама быстро бежит к Настику
        momX += 6;
        
        // Обновляем расстояние в UI
        let distancePercent = Math.min(100, Math.max(0, ((girl.x - momX - 30) / 120) * 100));
        document.getElementById('distance').textContent = Math.floor(distancePercent);
        
        // Когда мама догнала
        if (momX + 35 >= girl.x - 10) {
            gameOverAnimation = false;
        }
        
        draw();
        return;
    }
    
    if (!gameRunning) {
        draw();
        return;
    }
    
    // Физика прыжка девочки
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
        if (Math.random() < 0.025) {
            spawnObstacle();
            obstacleCooldown = 45 + Math.random() * 35;
        }
    } else {
        obstacleCooldown--;
    }
    
    // Начисление очков за выживание
    score += 0.25;
    
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
setInterval(updateGame, 1000 / 60);
