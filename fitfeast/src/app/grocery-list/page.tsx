import React from 'react';
import FitFeastLayout from '../components/layout/FitFeastLayout';
import GroceryListView from '../components/grocery-list/GroceryListView';

export default function GroceryListPage() {
  return (
    <FitFeastLayout>
      <GroceryListView />
    </FitFeastLayout>
  );
}
