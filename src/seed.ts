import type { AppState } from "./models";

function isoDate(d:Date){ return d.toISOString().slice(0,10); }
function daysOffset(n:number){ const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+n); return isoDate(d); }

export function buildSeed():AppState{
  const today = isoDate(new Date());
  return {
    currency:"INR",
    tasks:[
      {
        id:"t1",
        title:"Finish LifeOS overview dashboard",
        description:"Polish metrics & activity feed",
        status:"doing",
        priority:"high",
        category:"Work",
        dueDate:today,
        createdAt:daysOffset(-4),
        subtasks:[
          {id:"st1", title:"Polish hero metrics layout", completed:true},
          {id:"st2", title:"Wire ambient sound selector", completed:true},
          {id:"st3", title:"Verify mobile sidebar collapse", completed:false}
        ]
      },
      {id:"t2", title:"Pay electricity bill", description:"Due before late fee", status:"todo", priority:"urgent", category:"Finance", dueDate:daysOffset(-1), createdAt:daysOffset(-6)}, // overdue
      {id:"t3", title:"Morning run — 5km", status:"done", priority:"medium", category:"Health", dueDate:daysOffset(0), createdAt:daysOffset(-5), completedAt: today+"T08:30:00"},
      {
        id:"t4",
        title:"Review Q1 budget categories",
        status:"todo",
        priority:"high",
        category:"Finance",
        dueDate:daysOffset(1),
        createdAt:daysOffset(-2),
        subtasks:[
          {id:"st4", title:"Collect bank & credit card statements", completed:true},
          {id:"st5", title:"Calculate discretionary spend", completed:false},
          {id:"st6", title:"Adjust monthly category limits", completed:false}
        ]
      },
      {id:"t5", title:"Design kanban drag-and-drop", status:"doing", priority:"medium", category:"Work", dueDate:daysOffset(2), createdAt:daysOffset(-3)},
      {id:"t6", title:"Read Deep Work ch.3", status:"todo", priority:"low", category:"Learning", dueDate:daysOffset(3), createdAt:daysOffset(-3)},
      {
        id:"t7",
        title:"Grocery restock & meal prep",
        status:"todo",
        priority:"medium",
        category:"Home",
        dueDate:daysOffset(0),
        createdAt:daysOffset(-1),
        subtasks:[
          {id:"st7", title:"Check pantry inventory", completed:true},
          {id:"st8", title:"Order vegetables & dairy", completed:false},
          {id:"st9", title:"Prep lunches for the week", completed:false}
        ]
      },
      {id:"t8", title:"Call parents — weekend plan", status:"todo", priority:"low", category:"Personal", dueDate:daysOffset(5), createdAt:daysOffset(-2)},
      {id:"t9", title:"Fix calendar conflict logic", status:"done", priority:"high", category:"Work", dueDate:daysOffset(-2), createdAt:daysOffset(-7), completedAt: daysOffset(-1)+"T16:00:00"},
      {id:"t10", title:"Doctor appointment follow-up", status:"todo", priority:"urgent", category:"Health", dueDate:daysOffset(-2), createdAt:daysOffset(-4)}, // overdue urgent
      {id:"t11", title:"Update portfolio site", status:"done", priority:"medium", category:"Work", dueDate:daysOffset(-5), createdAt:daysOffset(-10), completedAt: daysOffset(-4)+"T10:00:00"},
      {id:"t12", title:"Plan Goa trip itinerary", status:"todo", priority:"low", category:"Personal", dueDate:daysOffset(10), createdAt:daysOffset(-1)},
      {
        id:"t13",
        title:"Prepare sprint demo slides",
        status:"todo",
        priority:"high",
        category:"Work",
        dueDate:daysOffset(1),
        createdAt:daysOffset(-2),
        subtasks:[
          {id:"st10", title:"Outline key milestones reached", completed:false},
          {id:"st11", title:"Record short 60s demo GIF", completed:false},
          {id:"st12", title:"Review slides with team lead", completed:false}
        ]
      },
      {id:"t14", title:"Water plants & balcony clean", status:"done", priority:"low", category:"Home", dueDate:daysOffset(-1), createdAt:daysOffset(-3), completedAt: daysOffset(0)+"T07:00:00"},
    ],
    habits:[
      {id:"h1", name:"Morning Run", category:"Health", frequency:"daily", targetPerWeek:5, icon:"🏃", color:"#22c55e", createdAt:daysOffset(-30)},
      {id:"h2", name:"Meditate", category:"Mind", frequency:"daily", targetPerWeek:7, icon:"🧘", color:"#7c6cff", createdAt:daysOffset(-30)},
      {id:"h3", name:"Read", category:"Learning", frequency:"daily", targetPerWeek:6, icon:"📚", color:"#f59e0b", createdAt:daysOffset(-30)},
      {id:"h4", name:"No Sugar", category:"Health", frequency:"weekdays", targetPerWeek:5, icon:"🥗", color:"#06b6d4", createdAt:daysOffset(-30)},
      {id:"h5", name:"Code Kata", category:"Work", frequency:"weekly", targetPerWeek:3, icon:"💻", color:"#f472b6", createdAt:daysOffset(-30)},
      {id:"h6", name:"Journal", category:"Mind", frequency:"daily", targetPerWeek:7, icon:"✍️", color:"#a78bfa", createdAt:daysOffset(-30)},
    ],
    habitLogs: (() => {
      const logs:{habitId:string;date:string}[]=[];
      // create ~ 21 days history with streaks
      for(let i=0;i<21;i++){
        const d=daysOffset(-i);
        if(i<7) { // recent streak for h1 and h2
          if(i!==3) logs.push({habitId:"h1", date:d});
          logs.push({habitId:"h2", date:d});
          if(i%2===0) logs.push({habitId:"h3", date:d});
        } else if(i<14){
          if(i%3!==0) logs.push({habitId:"h1", date:d});
          if(i%2===0) logs.push({habitId:"h2", date:d});
        } else {
          if(Math.random()>.4) logs.push({habitId:"h6", date:d});
        }
        if(i<5) logs.push({habitId:"h4", date:d});
        if(i%4===0) logs.push({habitId:"h5", date:d});
      }
      // ensure today partly completed
      if(!logs.find(l=>l.habitId==="h1"&&l.date===today)) logs.push({habitId:"h1", date:today});
      // avoid duplicate via set
      const m=new Map(logs.map(l=>[l.habitId+"|"+l.date,l]));
      return [...m.values()];
    })(),
    transactions:[
      {id:"tx1", type:"income", amountPaise:8500000, category:"Salary", description:"Monthly salary credited", date:daysOffset(-25)},
      {id:"tx2", type:"expense", amountPaise:320000, category:"Groceries", description:"BigBasket monthly stock", date:daysOffset(-22)},
      {id:"tx3", type:"expense", amountPaise:180000, category:"Dining", description:"Dinner at Toit", date:daysOffset(-20)},
      {id:"tx4", type:"expense", amountPaise:450000, category:"Rent", description:"Rent transfer", date:daysOffset(-18)},
      {id:"tx5", type:"expense", amountPaise:95000, category:"Transport", description:"Metro & rapido", date:daysOffset(-16)},
      {id:"tx6", type:"expense", amountPaise:210000, category:"Shopping", description:"Uniqlo & Decathlon", date:daysOffset(-15)},
      {id:"tx7", type:"income", amountPaise:600000, category:"Freelance", description:"Landing page project", date:daysOffset(-14)},
      {id:"tx8", type:"expense", amountPaise:120000, category:"Health", description:"Pharmacy & checkup", date:daysOffset(-12)},
      {id:"tx9", type:"expense", amountPaise:280000, category:"Entertainment", description:"Concert tickets", date:daysOffset(-11)},
      {id:"tx10", type:"expense", amountPaise:70000, category:"Utilities", description:"Internet + electricity", date:daysOffset(-10)},
      {id:"tx11", type:"expense", amountPaise:160000, category:"Groceries", description:"Weekly vegetables", date:daysOffset(-8)},
      {id:"tx12", type:"expense", amountPaise:90000, category:"Dining", description:"Lunch with team", date:daysOffset(-6)},
      {id:"tx13", type:"expense", amountPaise:50000, category:"Transport", description:"Fuel", date:daysOffset(-5)},
      {id:"tx14", type:"expense", amountPaise:110000, category:"Shopping", description:"Books & stationery", date:daysOffset(-4)},
      {id:"tx15", type:"expense", amountPaise:240000, category:"Travel", description:"Goa flight advance", date:daysOffset(-3)},
      {id:"tx16", type:"income", amountPaise:250000, category:"Investment", description:"Dividend payout", date:daysOffset(-2)},
      {id:"tx17", type:"expense", amountPaise:180000, category:"Dining", description:"Weekend brunch", date:daysOffset(-1)},
      {id:"tx18", type:"expense", amountPaise:95000, category:"Health", description:"Gym supplement", date:daysOffset(0)},
      {id:"tx19", type:"expense", amountPaise:130000, category:"Groceries", description:"Quick commerce top-up", date:daysOffset(0)},
      {id:"tx20", type:"expense", amountPaise:60000, category:"Utilities", description:"Mobile recharge", date:daysOffset(0)},
      {id:"tx21", type:"expense", amountPaise:410000, category:"Shopping", description:"Headphones", date:daysOffset(0)},
      {id:"tx22", type:"expense", amountPaise:80000, category:"Transport", description:"Airport taxi", date:daysOffset(1)},
    ],
    budgets:[
      {category:"Groceries", limitPaise:800000},
      {category:"Dining", limitPaise:500000},
      {category:"Transport", limitPaise:300000},
      {category:"Shopping", limitPaise:600000},
      {category:"Entertainment", limitPaise:400000},
      {category:"Health", limitPaise:300000},
      {category:"Utilities", limitPaise:200000},
      {category:"Travel", limitPaise:500000},
      {category:"Rent", limitPaise:500000},
    ],
    events:[
      {id:"e1", title:"Sprint standup", date:daysOffset(0), start:"09:30", end:"10:00", color:"#7c6cff", description:"Daily sync"},
      {id:"e2", title:"Deep work — LifeOS", date:daysOffset(0), start:"10:00", end:"12:00", color:"#22c55e", description:"Maker block"},
      {id:"e3", title:"Lunch with Priya", date:daysOffset(0), start:"13:00", end:"14:00", color:"#f59e0b", description:"Café"},
      {id:"e4", title:"Client review", date:daysOffset(0), start:"13:30", end:"14:30", color:"#ef4444", description:"Conflicts with lunch"}, // intentional conflict with e3
      {id:"e5", title:"Gym", date:daysOffset(1), start:"07:00", end:"08:00", color:"#06b6d4"},
      {id:"e6", title:"Demo rehearsal", date:daysOffset(1), start:"15:00", end:"16:00", color:"#7c6cff"},
      {id:"e7", title:"Goa flight", date:daysOffset(5), start:"06:15", end:"07:45", color:"#f472b6"},
      {id:"e8", title:"Monthly review", date:daysOffset(2), start:"17:00", end:"18:00", color:"#a78bfa"},
      {id:"e9", title:"Dentist", date:daysOffset(3), start:"11:00", end:"12:00", color:"#22c55e"},
    ],
    goals:[
      {id:"g1", title:"Ship LifeOS v1", description:"Launch integrated personal OS with all 7 modules", deadline:daysOffset(14), color:"#7c6cff", createdAt:daysOffset(-20), milestones:[
        {id:"m1", title:"Design system & tokens", completed:true, dueDate:daysOffset(-10)},
        {id:"m2", title:"Tasks + Habits modules", completed:true, dueDate:daysOffset(-4)},
        {id:"m3", title:"Finance, Focus, Calendar, Goals", completed:false, dueDate:daysOffset(2)},
        {id:"m4", title:"Polish & QA pass", completed:false, dueDate:daysOffset(10)},
      ]},
      {id:"g2", title:"Run 100 km this quarter", description:"Consistent running with habit tracking", deadline:daysOffset(45), color:"#22c55e", createdAt:daysOffset(-30), targetValue:100, currentValue:38, unit:"km", milestones:[
        {id:"m5", title:"25 km — first milestone", completed:true, dueDate:daysOffset(-20)},
        {id:"m6", title:"50 km", completed:false, dueDate:daysOffset(10)},
        {id:"m7", title:"75 km", completed:false, dueDate:daysOffset(28)},
        {id:"m8", title:"100 km", completed:false, dueDate:daysOffset(45)},
      ]},
      {id:"g3", title:"Save ₹1,50,000", description:"Build emergency fund before year-end", deadline:daysOffset(60), color:"#f59e0b", createdAt:daysOffset(-25), targetValue:15000000, currentValue:6200000, unit:"paise", milestones:[
        {id:"m9", title:"₹50k saved", completed:true, dueDate:daysOffset(-10)},
        {id:"m10", title:"₹1L saved", completed:false, dueDate:daysOffset(20)},
        {id:"m11", title:"₹1.5L saved", completed:false, dueDate:daysOffset(60)},
      ]},
      {id:"g4", title:"Read 12 books", description:"One book per month rhythm", deadline:daysOffset(90), color:"#a78bfa", createdAt:daysOffset(-30), milestones:[
        {id:"m12", title:"Books 1–3", completed:true, dueDate:daysOffset(-15)},
        {id:"m13", title:"Books 4–6", completed:false, dueDate:daysOffset(20)},
        {id:"m14", title:"Books 7–12", completed:false, dueDate:daysOffset(90)},
      ]},
    ],
    focusSessions:[
      {id:"fs1", startedAt:daysOffset(-2)+"T10:00:00", durationMinutes:25, completed:true},
      {id:"fs2", startedAt:daysOffset(-1)+"T15:30:00", durationMinutes:50, completed:true},
      {id:"fs3", startedAt:daysOffset(0)+"T09:00:00", durationMinutes:25, completed:true, taskId:"t1", taskTitle:"Finish LifeOS overview dashboard"},
      {id:"fs4", startedAt:daysOffset(0)+"T11:00:00", durationMinutes:25, completed:false},
    ],
  };
}

export function buildEmptyState(): AppState {
  return {
    currency: "INR",
    tasks: [],
    habits: [],
    habitLogs: [],
    transactions: [],
    budgets: [
      { category: "Food & Dining", limitPaise: 1200000 },
      { category: "Shopping", limitPaise: 800000 }
    ],
    events: [],
    goals: [],
    focusSessions: []
  };
}
