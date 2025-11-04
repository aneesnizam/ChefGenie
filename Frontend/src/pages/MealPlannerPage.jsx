import { useState } from 'react';
import { Plus, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MealPlannerPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekPlan, setWeekPlan] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const mealTypes = ['breakfast','lunch','dinner'];

  const availableRecipes = [
    { id:'1', title:'Creamy Garlic Parmesan Pasta', image:'https://images.unsplash.com/photo-1619568759244-8372de67304a?w=200', cookTime:'25 min' },
    { id:'2', title:'Grilled Salmon', image:'https://images.unsplash.com/photo-1708388464725-5c62c6e4574d?w=200', cookTime:'20 min' },
    { id:'3', title:'Buttermilk Pancakes', image:'https://images.unsplash.com/photo-1550041503-367c95109143?w=200', cookTime:'15 min' },
    { id:'4', title:'Veggie Stir-Fry', image:'https://images.unsplash.com/photo-1758979690131-11e2aa0b142b?w=200', cookTime:'18 min' },
  ];

  const addRecipeToSlot = (recipe) => {
    if(!selectedSlot) return;
    setWeekPlan(prev => ({
      ...prev,
      [selectedSlot.day]: {
        ...prev[selectedSlot.day],
        [selectedSlot.mealType]: { id: recipe.id, recipe }
      }
    }));
    setSelectedSlot(null);
  };

  const getTotalMeals = () => {
    let count = 0;
    Object.values(weekPlan).forEach(day => {
      if(day.breakfast?.recipe) count++;
      if(day.lunch?.recipe) count++;
      if(day.dinner?.recipe) count++;
    });
    return count;
  };

  return (
    <div className="min-h-screen px-10 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="mb-2 text-2xl font-bold">Meal Planner</h1>
            <p className="text-muted-foreground">Plan your week and generate grocery lists</p>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-1 px-4 py-2 border rounded-xl hover:bg-accent">
              <ChevronLeft className="w-4 h-4" /> Previous Week
            </button>
            <button className="flex items-center gap-1 px-4 py-2 border rounded-xl hover:bg-accent">
              Next Week <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5  rounded-2xl p-6 border border-primary/20">
            <p className="text-muted-foreground mb-1">Meals Planned</p>
            <p className="text-3xl font-bold">{getTotalMeals()}/21</p>
          </div>
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl p-6 border border-secondary/20">
            <p className="text-muted-foreground mb-1">Estimated Time</p>
            <p className="text-3xl font-bold">8.5 hrs</p>
          </div>
          <div className="bg-gradient-to-br from-accent to-accent/50 rounded-2xl p-6 border border-border">
            <p className="text-muted-foreground mb-1">Grocery Items</p>
            <p className="text-3xl font-bold">42 items</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Weekly Planner Grid */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-2xl border-border border overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-4 bg-muted/50 border-b">
                <div className="p-4">Day</div>
                <div className="p-4 text-center">Breakfast</div>
                <div className="p-4 text-center">Lunch</div>
                <div className="p-4 text-center">Dinner</div>
              </div>

              {/* Table Body */}
              {daysOfWeek.map(day => (
                <div key={day} className="grid grid-cols-4 border-b last:border-b-0">
                  <div className="p-4 flex items-center border-border bg-muted/30">{day}</div>

                  {mealTypes.map(mealType => {
                    const meal = weekPlan[day]?.[mealType]?.recipe;

                    return (
                      <div key={mealType}>
                        <button
                          onClick={() => setSelectedSlot({ day, mealType })}
                          className="p-3 min-h-[100px] flex flex-col items-center justify-center border border-border rounded-lg hover:bg-muted/50 w-full"
                        >
                          {meal ? (
                            <>
                              <p className="text-sm mb-1 line-clamp-2 text-center">{meal.title}</p>
                              <span className="text-xs ">{meal.cookTime}</span>
                            </>
                          ) : (
                            <Plus className="w-6 h-6 text-muted-foreground" />
                          )}
                        </button>

                        {/* Recipe Selection Modal */}
                        {selectedSlot && selectedSlot.day === day && selectedSlot.mealType === mealType && (
                          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-background p-6 rounded-2xl max-w-2xl w-full">
                              <h3 className="text-lg font-bold mb-4">
                                Add Recipe to {day} - {mealType}
                              </h3>
                              <input
                                type="text"
                                placeholder="Search recipes..."
                                className="w-full p-2 mb-4 border border-border rounded-xl focus:outline-3 "
                              />
                              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                {availableRecipes.map(recipe => (
                                  <button
                                    key={recipe.id}
                                    onClick={() => addRecipeToSlot(recipe)}
                                    className="text-left p-3 rounded-xl bg-muted/60 hover:bg-muted"
                                  >
                                    <div className="aspect-video rounded-lg overflow-hidden mb-2">
                                      <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="mb-1 line-clamp-2">{recipe.title}</p>
                                    <p className="text-xs text-gray-500">{recipe.cookTime}</p>
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setSelectedSlot(null)}
                                className="mt-4 px-4 py-2 border rounded-xl hover:bg-muted"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Grocery Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Grocery List</h3>
                <ShoppingCart className="w-5 h-5 text-purple-500 dark:text-primary" />
              </div>
              <div className="max-h-96 overflow-y-auto mb-4 space-y-4">
                {['Vegetables','Proteins','Dairy'].map(category => (
                  <div key={category}>
                    <p className="text-sm text-gray-500 mb-2">{category}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sample Item</span>
                        <span className="text-gray-500">Qty</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 dark:from-primary dark:to-secondary flex items-center justify-center gap-2 text-white">
                <ShoppingCart className="w-4 h-4" /> Export List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
