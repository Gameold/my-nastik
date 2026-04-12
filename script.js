console.log('🟢 Скрипт запущен');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 48, 450);
    canvas.style.width = `${maxWidth}px`;
    canvas.style.height = `${maxWidth * 1.33}px`;
    canvas.width = 600;
    canvas.height = 800;
}

let gameRunning = true;
let gameOverAnimation = false;
let score = 0;
let momX = 50;
let highScore = 0;

const girl = {
    x: 150, y: 620, width: 45, height: 60,
    yVelocity: 0, isJumping: false,
    gravity: 0.9, jumpPower: -14,
    groundY: 620, state: 'run'
};

let obstacles = [];
let obstacleCooldown = 0;
let girlCurrentFrame = 0;
let girlAnimationCounter = 0;

// ID таблицы рекордов (должен совпадать с созданным)
const LEADERBOARD_ID = 'score';

// ПРОВЕРКА ПОДДЕРЖКИ МЕТОДА
async function checkMethodSupport(methodName) {
    try {
        const supported = await vkBridge.send("VKWebAppGetSupportedMethods");
        console.log(`📋 Поддерживаемые методы:`, supported);
        return supported.includes(methodName);
    } catch (e) {
        console.error('Ошибка проверки методов:', e);
        return false;
    }
}

// СОХРАНЕНИЕ РЕКОРДА (с альтернативными методами)
async function saveScore(scoreValue) {
    console.log('💾 Попытка сохранить рекорд:', scoreValue);
    
    if (!window.vkBridge) {
        console.log('⚠️ VK Bridge не найден');
        alert('Запустите игру в приложении VK');
        return false;
    }
    
    // Проверяем поддержку метода
    const isSupported = await checkMethodSupport('VKWebAppAddToLeaderboard');
    if (!isSupported) {
        console.log('⚠️ Метод VKWebAppAddToLeaderboard не поддерживается');
        alert('Таблица рекордов не настроена. Проверьте настройки приложения в VK');
        return false;
    }
    
    try {
        // Основной метод
        const result = await vkBridge.send("VKWebAppAddToLeaderboard", {
            score: scoreValue,
            leaderboard_id: LEADERBOARD_ID
        });
        console.log('✅ Рекорд сохранён!', result);
        alert(`✅ Рекорд ${scoreValue} сохранён!`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        
        // Пробуем альтернативный метод (если есть)
        try {
            console.log('🔄 Пробуем альтернативный метод...');
            const result2 = await vkBridge.send("VKWebAppAddToLeaderboard", {
                score: scoreValue,
                leaderboard_id: LEADERBOARD_ID,
                user_result: scoreValue
            });
            console.log('✅ Альтернативный метод сработал!', result2);
            alert(`✅ Рекорд ${scoreValue} сохранён!`);
            return true;
        } catch (error2) {
            console.error('❌ Альтернативный метод тоже не сработал:', error2);
            alert('Ошибка: таблица рекордов не настроена. Создайте таблицу в настройках приложения VK');
            return false;
        }
    }
}

// ПОКАЗ ТАБЛИЦЫ РЕКОРДОВ
async function showLeaderboard() {
    console.log('📊 Открытие таблицы рекордов...');
    
    if (!window.vkBridge) {
        alert('VK Bridge не инициализирован');
        return;
    }
    
    try {
        await vkBridge.send("VKWebAppShowLeaderboard", {
            leaderboard_id: LEADERBOARD_ID
        });
    } catch (error) {
        console.error('❌ Ошибка открытия таблицы:', error);
        alert('Таблица рекордов пока недоступна. Проверьте настройки приложения');
    }
}

// ПОЛУЧЕНИЕ ЛИЧНОГО РЕКОРДА
async function getMyBestScore() {
    if (!window.vkBridge) return 0;
    
    try {
        const data = await vkBridge.send("VKWebAppGetLeaderboardExtended", {
            leaderboard_id: LEADERBOARD_ID,
            count: 1
        });
        if (data.users && data.users.length > 0) {
            console.log('🏆 Личный рекорд из VK:', data.users[0].score);
            return data.users[0].score;
        }
    } catch (error) {
        console.error('Ошибка получения рекорда:', error);
    }
    return 0;
}

function jump() {
    if (!gameRunning || gameOverAnimation) return;
    if (!girl.isJumping && girl.y >= girl.groundY) {
        girl.yVelocity = girl.jumpPower;
        girl.isJumping = true;
        girl.state = 'jump';
    }
}

async function resetGame() {
    const finalScore = Math.floor(score);
    console.log('🔄 Сброс игры. Счёт:', finalScore);
    
    if (finalScore > 0 && finalScore > highScore) {
        highScore = finalScore;
        await saveScore(finalScore);
    }
    
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
    obstacles.push({ x: canvas.width, y: 625, width: 40, height: 45 });
}

function updateUI() {
    document.getElementById('score').textContent = Math.floor(score);
    const highScoreElem = document.getElementById('highScore');
    if (highScoreElem) highScoreElem.textContent = highScore;
    
    let distancePercent = Math.min(100, Math.max(0, ((150 - momX - 30) / 120) * 100));
    document.getElementById('distance').textContent = Math.floor(distancePercent);
}

function checkCollisions() {
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (150 < obs.x + obs.width && 150 + 45 > obs.x &&
            girl.y + girl.height > obs.y && girl.y < obs.y + obs.height) {
            gameRunning = false;
            gameOverAnimation = true;
            girl.state = 'fall';
            console.log('💥 ИГРА ОКОНЧЕНА! Счёт:', Math.floor(score));
            // Сохраняем рекорд
            saveCurrentScore();
            return;
        }
    }
}

async function saveCurrentScore() {
    const currentScore = Math.floor(score);
    if (currentScore > 0 && currentScore > highScore) {
        highScore = currentScore;
        await saveScore(currentScore);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(80, 80, 50, 35, 0, 0, Math.PI*2);
    ctx.ellipse(130, 70, 45, 30, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(480, 120, 55, 38, 0, 0, Math.PI*2);
    ctx.ellipse(540, 105, 45, 32, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 670, canvas.width, 130);
    ctx.fillStyle = '#6B8E23';
    ctx.fillRect(0, 665, canvas.width, 15);
    
    ctx.fillStyle = '#8B4513';
    for (let obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(obs.x + 8, obs.y - 8, 24, 10);
        ctx.fillStyle = '#8B4513';
    }
    
    if (gameOverAnimation && !gameRunning) {
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(momX, 610, 50, 65);
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(momX + 5, 595, 40, 18);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(momX + 12, 600, 6, 6);
        ctx.fillRect(momX + 28, 600, 6, 6);
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
    
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(girl.x, girl.y, girl.width, girl.height);
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(girl.x + 8, girl.y - 12, 28, 14);
    ctx.fillStyle = '#000';
    ctx.fillRect(girl.x + 32, girl.y + 18, 5, 5);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(girl.x + 15, girl.y + 38, 15, 7);
    
    if (girl.state === 'run') {
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
    
    if (!gameRunning && !gameOverAnimation) {
        ctx.font = 'bold 36px system-ui';
        ctx.fillStyle = '#FF0000';
        ctx.fillText('GAME OVER', canvas.width/2 - 110, canvas.height/2 - 50);
        ctx.font = '20px system-ui';
        ctx.fillStyle = '#333';
        ctx.fillText('Мама догнала!', canvas.width/2 - 75, canvas.height/2 + 20);
        ctx.font = '18px system-ui';
        ctx.fillStyle = '#666';
        ctx.fillText(`Твой счёт: ${Math.floor(score)}`, canvas.width/2 - 80, canvas.height/2 + 70);
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
        if (momX + 45 >= 150 - 10) {
            gameOverAnimation = false;
        }
        updateUI();
        draw();
        return;
    }
    
    if (!gameRunning) {
        draw();
        return;
    }
    
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
    
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= 6;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
    
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

function handleTap(e) {
    const target = e.target;
    if (target.id === 'resetBtn') return;
    if (target.id === 'leaderboardBtn') return;
    e.preventDefault();
    jump();
}

function addLeaderboardButton() {
    const container = document.querySelector('.buttons-container');
    if (document.getElementById('leaderboardBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'leaderboardBtn';
    btn.innerHTML = '🏆 Рекорды';
    btn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    btn.style.padding = '14px 28px';
    btn.style.borderRadius = '50px';
    btn.style.fontSize = '18px';
    btn.style.fontWeight = 'bold';
    btn.style.border = 'none';
    btn.style.color = 'white';
    btn.style.cursor = 'pointer';
    btn.onclick = () => showLeaderboard();
    btn.ontouchstart = (e) => { e.stopPropagation(); showLeaderboard(); };
    container.appendChild(btn);
    console.log('🔘 Кнопка рекордов добавлена');
}

canvas.addEventListener('touchstart', handleTap, { passive: false });
canvas.addEventListener('mousedown', handleTap);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); jump(); }
});

document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('resetBtn').addEventListener('touchstart', (e) => {
    e.stopPropagation();
    resetGame();
});

window.addEventListener('resize', () => resizeCanvas());
resizeCanvas();

async function initVK() {
    console.log('🟢 Инициализация VK Bridge...');
    
    let waitCount = 0;
    while (!window.vkBridge && waitCount < 50) {
        await new Promise(r => setTimeout(r, 100));
        waitCount++;
    }
    
    if (window.vkBridge) {
        console.log('✅ VK Bridge найден');
        try {
            await vkBridge.send('VKWebAppInit');
            console.log('✅ VK Bridge инициализирован');
            highScore = await getMyBestScore();
            console.log('🏆 Загруженный рекорд:', highScore);
        } catch (err) {
            console.error('❌ Ошибка VK Bridge:', err);
        }
    } else {
        console.log('⚠️ VK Bridge не найден');
    }
    
    updateUI();
    addLeaderboardButton();
    resetGame();
}

initVK();
setInterval(updateGame, 1000 / 60);
