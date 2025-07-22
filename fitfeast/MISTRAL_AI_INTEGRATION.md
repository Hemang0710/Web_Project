# Mistral AI Recipe Search Integration

## Overview

The FitFeast application now includes **Mistral AI-powered recipe search** functionality that enhances the existing search capabilities with intelligent, AI-generated recipe suggestions.

## Features Added

### 1. AI-Powered Recipe Search (`searchRecipesWithAI`)
- **Location**: `src/app/lib/aiUtils.ts`
- **Function**: Generates recipes based on natural language queries and filters
- **Capabilities**:
  - Natural language understanding
  - Filter-aware recipe generation
  - Budget and nutrition constraints
  - Ingredient-based filtering

### 2. AI Recipe Recommendations (`getAIRecipeRecommendations`)
- **Function**: Provides personalized recipe recommendations
- **Capabilities**:
  - User preference analysis
  - Dietary restriction handling
  - Budget-aware suggestions
  - Cooking skill level matching

### 3. Enhanced API Endpoints
- **New API**: `/api/ai/recipe` (GET & POST)
- **Enhanced API**: `/api/recipes` (now includes AI search)
- **Capabilities**:
  - Dedicated AI search endpoint
  - Hybrid search (database + external + AI)
  - Recommendation system

### 4. Updated Frontend
- **Enhanced UI**: `src/app/recipes/page.tsx`
- **New Features**:
  - AI search toggle
  - Visual indicators for AI-generated recipes
  - Improved search experience

## How It Works

### Search Flow
1. **User Input**: User enters search query and selects "AI-Powered Search"
2. **API Call**: Frontend calls `/api/ai/recipe` with search parameters
3. **Mistral AI Processing**: 
   - Constructs intelligent prompt with filters
   - Calls Mistral AI API (`mistral-small-latest` model)
   - Parses JSON response
4. **Result Processing**: Formats and returns AI-generated recipes
5. **UI Display**: Shows results with AI indicators

### Prompt Engineering
The AI prompts are carefully crafted to:
- Include all user filters (cuisine, diet, calories, cost, etc.)
- Request structured JSON responses
- Ensure realistic, budget-friendly recipes
- Provide comprehensive recipe information

### Fallback System
- **JSON Parsing**: Handles malformed AI responses gracefully
- **Error Handling**: Continues search without AI if API fails
- **Mock Data**: Provides fallback recipes when needed

## Configuration

### Environment Variables
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

### API Configuration
- **Model**: `mistral-small-latest` (free tier)
- **Base URL**: `https://api.mistral.ai/v1`
- **Max Tokens**: 1000-1200 (configurable per function)

## Usage Examples

### Basic AI Search
```typescript
const recipes = await searchRecipesWithAI("quick pasta dinner", {
  cuisine: "italian",
  maxCalories: 500,
  maxCost: 15
});
```

### AI Recommendations
```typescript
const recommendations = await getAIRecipeRecommendations({
  favoriteCuisines: ["italian", "mexican"],
  dietaryRestrictions: ["vegetarian"],
  budget: 50,
  cookingSkill: "beginner"
});
```

### API Endpoint Usage
```bash
# GET request
GET /api/ai/recipe?q=quick dinner&cuisine=italian&maxCalories=500

# POST request
POST /api/ai/recipe
{
  "searchQuery": "quick dinner",
  "filters": {
    "cuisine": "italian",
    "maxCalories": 500
  },
  "searchType": "search"
}
```

## Integration Points

### 1. Main Recipe Search (`/api/recipes`)
- AI search is integrated as a fallback when database/external results are insufficient
- Maintains backward compatibility
- Provides hybrid search results

### 2. Frontend Integration
- Radio button toggle between regular and AI search
- Visual indicators for AI-generated content
- Seamless user experience

### 3. Error Handling
- Graceful degradation when AI is unavailable
- Fallback to existing search methods
- User-friendly error messages

## Benefits

### 1. Enhanced Search Capabilities
- **Natural Language**: Understands queries like "quick healthy dinner"
- **Context Awareness**: Considers all filters simultaneously
- **Creative Suggestions**: Generates unique recipe combinations

### 2. Improved User Experience
- **Personalized Results**: Tailored to user preferences
- **Better Filtering**: More intelligent constraint handling
- **Visual Feedback**: Clear indication of AI-generated content

### 3. Scalability
- **Hybrid Approach**: Combines multiple data sources
- **Fallback System**: Robust error handling
- **Configurable**: Easy to adjust AI parameters

## Testing

### Test Page
- **URL**: `/test-ai`
- **Purpose**: Verify Mistral AI integration
- **Features**: Direct AI search testing with detailed results display

### Test Commands
```bash
# Test AI search functionality
curl -X POST http://localhost:3000/api/ai/recipe \
  -H "Content-Type: application/json" \
  -d '{"searchQuery": "quick pasta dinner", "filters": {"maxCalories": 500}}'
```

## Future Enhancements

### 1. Advanced AI Features
- **Recipe Adaptation**: Modify existing recipes based on preferences
- **Ingredient Substitution**: AI-powered ingredient alternatives
- **Nutrition Optimization**: AI-driven nutrition improvements

### 2. Personalization
- **Learning System**: Remember user preferences over time
- **Seasonal Suggestions**: AI-generated seasonal recipe recommendations
- **Dietary Evolution**: Adapt to changing dietary needs

### 3. Integration Expansion
- **Meal Planning**: AI-powered meal plan generation
- **Shopping Lists**: Intelligent ingredient suggestions
- **Recipe Scaling**: AI-assisted portion adjustments

## Troubleshooting

### Common Issues
1. **API Key Missing**: Ensure `MISTRAL_API_KEY` is set in environment
2. **Rate Limiting**: Mistral AI has usage limits on free tier
3. **JSON Parsing Errors**: AI responses may not always be valid JSON
4. **Network Issues**: Handle API timeouts gracefully

### Debug Steps
1. Check environment variables
2. Test API connectivity
3. Verify prompt formatting
4. Review error logs
5. Use test page for validation

## Conclusion

The Mistral AI integration significantly enhances FitFeast's recipe search capabilities by providing intelligent, context-aware recipe generation. The hybrid approach ensures reliability while offering cutting-edge AI features to users. 