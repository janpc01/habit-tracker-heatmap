class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.heatmaps = new Map();
        this.currentHabitId = null;
        this.init();
        this.initModalHandlers();
    }

    initModalHandlers() {
        const modal = document.getElementById('logModal');
        const closeBtn = modal.querySelector('.close');
        const submitBtn = document.getElementById('submitLog');
        const dateInput = document.getElementById('logDate');

        // Set default date to today
        dateInput.valueAsDate = new Date();

        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };

        submitBtn.onclick = () => {
            const date = new Date(dateInput.value);
            const value = parseInt(document.getElementById('logValue').value);
            if (value >= 0 && value <= 5) {
                this.toggleHabitDay(this.currentHabitId, date, value);
                modal.style.display = 'none';
            } else {
                alert('Please enter a value between 0 and 5');
            }
        };
    }

    showLogModal(habitId) {
        this.currentHabitId = habitId;
        const modal = document.getElementById('logModal');
        modal.style.display = 'block';
    }

    toggleHabitDay(habitId, date, value) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            const dateStr = date.toISOString().split('T')[0];
            habit.data[dateStr] = value;
            console.log('Habit data after toggle:', habit.data);
            this.saveHabits();
            this.updateHeatmap(habit);
        }
    }

    saveHabits() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }

    renderHabits() {
        const container = document.getElementById('habits-container');
        container.innerHTML = '';
        
        this.habits.forEach(habit => {
            const habitElement = this.createHabitElement(habit);
            container.appendChild(habitElement);
            this.initHeatmap(habit);
        });
    }

    createHabitElement(habit) {
        const div = document.createElement('div');
        div.className = 'habit-card';
        div.innerHTML = `
            <div class="habit-header">
                <h2>${habit.name}</h2>
                <div class="habit-controls">
                    <button onclick="tracker.showLogModal(${habit.id})">Log</button>
                    <button onclick="tracker.deleteHabit(${habit.id})">Delete</button>
                </div>
            </div>
            <div id="heatmap-${habit.id}"></div>
        `;
        return div;
    }

    initHeatmap(habit) {
        const cal = new CalHeatmap();
        
        const formattedData = [];
        for (const [dateStr, value] of Object.entries(habit.data)) {
            const timestamp = isNaN(dateStr) ? 
                Math.floor(new Date(dateStr).getTime() / 1000) : 
                parseInt(dateStr);
            
            if (!isNaN(timestamp)) {
                formattedData.push({
                    date: timestamp,
                    value: parseInt(value)
                });
            }
        }
        
        console.log('Formatted data for heatmap:', formattedData);

        cal.paint({
            itemSelector: `#heatmap-${habit.id}`,
            range: 12,
            domain: { 
                type: 'month',
            },
            subDomain: { 
                type: 'day',
                width: 10,
                height: 10,
                radius: 2
            },
            date: {
                start: new Date(new Date().getFullYear(), 0, 1),
                min: new Date(new Date().getFullYear(), 0, 1),
                max: new Date(new Date().getFullYear(), 11, 31)
            },
            data: {
                source: formattedData,
                type: 'json',
                x: 'date',
                y: 'value',
                groupY: 'max'
            },
            scale: {
                color: {
                    range: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                    type: 'threshold',
                    domain: [1, 2, 3, 4, 5]
                }
            }
        });
        
        console.log('Heatmap initialized for habit:', habit.name);
        this.heatmaps.set(habit.id, cal);
    }

    updateHeatmap(habit) {
        console.log('Updating heatmap for habit:', habit.name);
        console.log('Current habit data:', habit.data);
        
        const cal = this.heatmaps.get(habit.id);
        if (cal) {
            console.log('Found existing heatmap, destroying...');
            cal.destroy();
            console.log('Reinitializing heatmap...');
            this.initHeatmap(habit);
        } else {
            console.log('No existing heatmap found for habit:', habit.name);
        }
    }

    deleteHabit(habitId) {
        this.habits = this.habits.filter(h => h.id !== habitId);
        this.saveHabits();
        this.renderHabits();
    }

    init() {
        this.renderHabits();
        
        window.addHabit = () => {
            const input = document.getElementById('habitInput');
            const habitName = input.value.trim();
            
            if (habitName) {
                const habit = {
                    id: Date.now(),
                    name: habitName,
                    data: {}
                };
                
                this.habits.push(habit);
                this.saveHabits();
                input.value = '';
                
                const container = document.getElementById('habits-container');
                container.innerHTML = '';
                this.renderHabits();
            }
        };
    }
}

const tracker = new HabitTracker();

function addHabit() {
    const input = document.getElementById('habitInput');
    const habitName = input.value.trim();
    
    if (habitName) {
        tracker.addHabit(habitName);
        input.value = '';
    }
}