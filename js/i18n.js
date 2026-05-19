/**
 * i18n - Internationalization System
 * Supports English and Japanese
 */

const i18n = (() => {
  let currentLang = localStorage.getItem('k_lang') || 'en';

  const translations = {
    en: {
      // General
      appName: 'Katachi',
      logout: 'Logout',
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      create: 'Create',
      search: 'Search',
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      
      // Navigation
      recipes: 'Recipes',
      prepLists: 'Prep Lists',
      inventory: 'Inventory',
      scanning: 'Scanning',
      codes: 'Access Codes',
      pricing: 'Pricing',
      aiAssistant: 'AI Assistant',
      
      // Landing Page
      landingTitle: 'katachi',
      landingSubtitle: '形',
      landingDesc: 'Recipe management, kitchen prep, and ordering\nbuilt for the precision of professional craft.',
      startFreeTrial: 'Start Free Trial',
      signIn: 'Sign In',
      freeForever: 'Free Forever',
      pro: 'Pro $29',
      growth: 'Growth $59',
      multi: 'Multi $149',
      trialText: '14-day free trial · No credit card required · English & 日本語',
      
      // Auth
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      emailPlaceholder: 'chef@restaurant.com',
      passwordPlaceholder: '••••••••',
      namePlaceholder: 'Chef Alice',
      passwordMismatch: 'Passwords do not match',
      allFieldsRequired: 'All fields are required',
      passwordTooShort: 'Password must be at least 6 characters',
      signupFailed: 'Signup failed',
      loginFailed: 'Login failed',
      userNotFound: 'User not found',
      invalidPassword: 'Invalid password',
      emailAlreadyRegistered: 'Email already registered',
      
      // Language Select
      selectLanguage: 'Select Language',
      english: 'English',
      japanese: '日本語',
      
      // Recipes
      recipesTitle: 'Recipes',
      recipesSubtitle: 'Your recipe library',
      newRecipe: '+ New Recipe',
      recipeName: 'Recipe Name',
      category: 'Category',
      yield: 'Yield',
      prepTime: 'Prep Time (mins)',
      cookTime: 'Cook Time (mins)',
      ingredients: 'Ingredients',
      steps: 'Steps',
      addIngredient: 'Add Ingredient',
      addStep: 'Add Step',
      noRecipes: 'No recipes yet',
      noRecipesDesc: 'Create your first recipe to get started',
      editRecipe: 'Edit Recipe',
      deleteRecipe: 'Delete Recipe',
      viewRecipe: 'View Recipe',
      scaleRecipe: 'Scale Recipe',
      costPerServing: 'Cost per serving',
      totalCost: 'Total cost',
      ingredient: 'Ingredient',
      quantity: 'Quantity',
      unit: 'Unit',
      cost: 'Cost',
      mainCourse: 'Main Course',
      appetizer: 'Appetizer',
      dessert: 'Dessert',
      sauce: 'Sauce',
      sides: 'Sides',
      
      // Prep Lists
      prepListsTitle: 'Prep Lists',
      prepListsSubtitle: 'Station-based prep sheets',
      buildPrepList: '+ Build Prep List',
      noPrepLists: 'No prep lists yet',
      noPrepListsDesc: 'Select recipes and create a prep sheet',
      selectRecipes: 'Select Recipes',
      station: 'Station',
      shift: 'Shift',
      prepDate: 'Prep Date',
      generatePrint: 'Generate & Print',
      savedPrepLists: 'Saved Prep Lists',
      amPrep: 'AM Prep',
      pmPrep: 'PM Prep',
      allDay: 'All Day',
      printPrep: 'Print Prep',
      
      // Inventory
      inventoryTitle: 'Inventory',
      inventorySubtitle: 'Raw materials and ingredients',
      itemName: 'Item Name',
      quantity: 'Quantity',
      unit: 'Unit',
      supplier: 'Supplier',
      cost: 'Cost',
      lastUpdated: 'Last Updated',
      addItem: '+ Add Item',
      updateQuantity: 'Update Quantity',
      lowStock: 'Low Stock',
      outOfStock: 'Out of Stock',
      
      // Scanning
      scanningTitle: 'AI Scanning',
      scanningSubtitle: 'Upload images - Claude reads invoices, recipes, handwriting',
      uploadImage: 'Upload Image',
      scanInvoice: 'Scan Invoice',
      scanRecipe: 'Scan Recipe Card',
      scanning: 'Scanning...',
      scanResult: 'Scan Result',
      retryUpload: 'Try Again',
      aiScanningPowered: 'AI-powered scanning with Claude Vision',
      
      // Codes
      codesTitle: 'Access Codes',
      codesSubtitle: 'Generate and manage access codes',
      generateCode: '+ Generate Code',
      codeValue: 'Code',
      status: 'Status',
      expiry: 'Expiry',
      tier: 'Tier',
      active: 'Active',
      expired: 'Expired',
      revoke: 'Revoke',
      shareCode: 'Share Code',
      codeRevoked: 'Code revoked',
      
      // Pricing
      pricingTitle: 'Pricing',
      pricingSubtitle: 'Choose your plan',
      monthlyBilling: 'Monthly',
      annualBilling: 'Annual',
      features: 'Features',
      selectPlan: 'Select Plan',
      currentPlan: 'Current Plan',
      freeTierNote: 'Free tier — limited features',
      
      // AI Features
      aiAssistantTitle: 'AI Recipe Assistant',
      askQuestion: 'What can I substitute for butter?',
      askClaude: 'Ask',
      aiRequests: 'AI requests:',
      generateRecipe: 'Generate Recipe',
      describeRecipe: 'Describe the recipe you want...',
      generating: 'Generating...',
      translateRecipe: 'Translate Recipe',
      translating: 'Translating...',
      aiResponseError: 'Failed to get AI response',
      
      // Messages
      recipeCreated: 'Recipe created successfully',
      recipeSaved: 'Recipe saved successfully',
      recipeDeleted: 'Recipe deleted',
      prepListCreated: 'Prep list created',
      itemAdded: 'Item added',
      itemUpdated: 'Item updated',
      itemDeleted: 'Item deleted',
      codeCopied: 'Code copied to clipboard',
      scanCompleted: 'Scan completed',
      confirmDelete: 'Are you sure you want to delete this?',
    },
    ja: {
      // General
      appName: 'Katachi',
      logout: 'ログアウト',
      back: '戻る',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      add: '追加',
      create: '作成',
      search: '検索',
      close: '閉じる',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      
      // Navigation
      recipes: 'レシピ',
      prepLists: 'プレップリスト',
      inventory: '在庫',
      scanning: 'スキャン',
      codes: 'アクセスコード',
      pricing: '価格',
      aiAssistant: 'AIアシスタント',
      
      // Landing Page
      landingTitle: 'katachi',
      landingSubtitle: '形',
      landingDesc: 'プロの職人のための精密な\nレシピ管理、仕込み、オーダーシステム',
      startFreeTrial: '無料で試す',
      signIn: 'ログイン',
      freeForever: '永遠に無料',
      pro: 'プロ ¥2,900',
      growth: 'グロース ¥5,900',
      multi: 'マルチ ¥14,900',
      trialText: '14日間の無料トライアル · クレジットカード不要 · English & 日本語',
      
      // Auth
      signUp: 'サインアップ',
      email: 'メールアドレス',
      password: 'パスワード',
      confirmPassword: 'パスワード確認',
      fullName: 'フルネーム',
      emailPlaceholder: 'chef@restaurant.com',
      passwordPlaceholder: '••••••••',
      namePlaceholder: 'シェフ太郎',
      passwordMismatch: 'パスワードが一致しません',
      allFieldsRequired: 'すべてのフィールドを入力してください',
      passwordTooShort: 'パスワードは6文字以上である必要があります',
      signupFailed: 'サインアップに失敗しました',
      loginFailed: 'ログインに失敗しました',
      userNotFound: 'ユーザーが見つかりません',
      invalidPassword: 'パスワードが正しくありません',
      emailAlreadyRegistered: 'このメールアドレスは既に登録されています',
      
      // Language Select
      selectLanguage: '言語を選択',
      english: 'English',
      japanese: '日本語',
      
      // Recipes
      recipesTitle: 'レシピ',
      recipesSubtitle: 'レシピライブラリ',
      newRecipe: '+ 新しいレシピ',
      recipeName: 'レシピ名',
      category: 'カテゴリ',
      yield: '人数',
      prepTime: '準備時間 (分)',
      cookTime: '調理時間 (分)',
      ingredients: '材料',
      steps: '手順',
      addIngredient: '材料を追加',
      addStep: 'ステップを追加',
      noRecipes: 'レシピがまだありません',
      noRecipesDesc: '最初のレシピを作成して開始します',
      editRecipe: 'レシピを編集',
      deleteRecipe: 'レシピを削除',
      viewRecipe: 'レシピを表示',
      scaleRecipe: 'レシピをスケール',
      costPerServing: '一人あたりのコスト',
      totalCost: '総コスト',
      ingredient: '材料',
      quantity: '数量',
      unit: '単位',
      cost: 'コスト',
      mainCourse: 'メインコース',
      appetizer: '前菜',
      dessert: 'デザート',
      sauce: 'ソース',
      sides: '副菜',
      
      // Prep Lists
      prepListsTitle: 'プレップリスト',
      prepListsSubtitle: 'ステーション別プレップシート',
      buildPrepList: '+ プレップリストを作成',
      noPrepLists: 'プレップリストがまだありません',
      noPrepListsDesc: 'レシピを選択してプレップシートを作成',
      selectRecipes: 'レシピを選択',
      station: 'ステーション',
      shift: 'シフト',
      prepDate: 'プレップ日',
      generatePrint: '生成して印刷',
      savedPrepLists: '保存されたプレップリスト',
      amPrep: '朝のプレップ',
      pmPrep: '夜のプレップ',
      allDay: '終日',
      printPrep: 'プレップを印刷',
      
      // Inventory
      inventoryTitle: '在庫',
      inventorySubtitle: '原材料と食材',
      itemName: '品目名',
      quantity: '数量',
      unit: '単位',
      supplier: '仕入先',
      cost: 'コスト',
      lastUpdated: '最終更新',
      addItem: '+ 品目を追加',
      updateQuantity: '数量を更新',
      lowStock: '在庫が少ない',
      outOfStock: '品切れ',
      
      // Scanning
      scanningTitle: 'AIスキャン',
      scanningSubtitle: '画像をアップロード - Claudeが請求書、レシピ、手書きを読み取ります',
      uploadImage: '画像をアップロード',
      scanInvoice: '請求書をスキャン',
      scanRecipe: 'レシピカードをスキャン',
      scanning: 'スキャン中...',
      scanResult: 'スキャン結果',
      retryUpload: 'もう一度試す',
      aiScanningPowered: 'Claude Visionを使用したAIスキャン',
      
      // Codes
      codesTitle: 'アクセスコード',
      codesSubtitle: 'アクセスコードを生成および管理',
      generateCode: '+ コードを生成',
      codeValue: 'コード',
      status: 'ステータス',
      expiry: '有効期限',
      tier: 'ティア',
      active: '有効',
      expired: '期限切れ',
      revoke: '取り消す',
      shareCode: 'コードを共有',
      codeRevoked: 'コードが取り消されました',
      
      // Pricing
      pricingTitle: '価格',
      pricingSubtitle: 'プランを選択',
      monthlyBilling: '月額',
      annualBilling: '年額',
      features: '機能',
      selectPlan: 'プランを選択',
      currentPlan: '現在のプラン',
      freeTierNote: '無料ティア — 限定機能',
      
      // AI Features
      aiAssistantTitle: 'AIレシピアシスタント',
      askQuestion: 'バターの代わりに何を使えますか？',
      askClaude: '質問する',
      aiRequests: 'AIリクエスト:',
      generateRecipe: 'レシピを生成',
      describeRecipe: '作りたいレシピを説明してください...',
      generating: '生成中...',
      translateRecipe: 'レシピを翻訳',
      translating: '翻訳中...',
      aiResponseError: 'AIレスポンスの取得に失敗しました',
      
      // Messages
      recipeCreated: 'レシピが正常に作成されました',
      recipeSaved: 'レシピが正常に保存されました',
      recipeDeleted: 'レシピが削除されました',
      prepListCreated: 'プレップリストが作成されました',
      itemAdded: 'アイテムが追加されました',
      itemUpdated: 'アイテムが更新されました',
      itemDeleted: 'アイテムが削除されました',
      codeCopied: 'コードがクリップボードにコピーされました',
      scanCompleted: 'スキャンが完了しました',
      confirmDelete: '削除してもよろしいですか？',
    }
  };

  function t(key) {
    return translations[currentLang]?.[key] || translations['en']?.[key] || key;
  }

  function setLanguage(lang) {
    if (translations[lang]) {
      currentLang = lang;
      localStorage.setItem('k_lang', lang);
      updateUIText();
      if (window.Logger) {
        window.Logger.info('Language changed', { lang });
      }
    }
  }

  function getLanguage() {
    return currentLang;
  }

  function updateUIText() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t(key);
      } else {
        el.textContent = t(key);
      }
    });
  }

  return {
    t,
    setLanguage,
    getLanguage,
    updateUIText,
    translations
  };
})();

// Export to window
window.i18n = i18n;
console.log('[i18n] i18n module loaded');
