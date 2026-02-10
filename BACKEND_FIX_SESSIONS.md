# Fix Laravel Sessions Table Error

## Problem
```
SQLSTATE[42S02]: Base table or view not found: 1146 Table 'stokship.sessions' doesn't exist
```

This error occurs when Laravel is configured to use database sessions but the `sessions` table doesn't exist.

## Solution Options

### Option 1: Create the Sessions Table (Recommended for Production)

1. **Navigate to your Laravel backend directory:**
   ```bash
   cd ../backend  # or wherever your Laravel project is
   ```

2. **Create the sessions migration:**
   ```bash
   php artisan session:table
   ```

3. **Run the migration:**
   ```bash
   php artisan migrate
   ```

This will create the `sessions` table in your database.

### Option 2: Change Session Driver to File (Quick Fix for Development)

1. **Open your Laravel `.env` file:**
   ```bash
   # In your Laravel backend directory
   nano .env
   # or
   code .env
   ```

2. **Change the session driver from `database` to `file`:**
   ```env
   SESSION_DRIVER=file
   ```

3. **Clear the config cache:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

### Option 3: Change Session Driver to Cookie (Alternative)

1. **In your Laravel `.env` file:**
   ```env
   SESSION_DRIVER=cookie
   ```

2. **Clear the config cache:**
   ```bash
   php artisan config:clear
   ```

## Verify the Fix

After applying one of the solutions above:

1. **Restart your Laravel server:**
   ```bash
   php artisan serve
   # or if using Laravel Sail/Valet
   ```

2. **Test the API endpoints** - the error should be resolved.

## Recommended Configuration

For **development**: Use `file` driver (Option 2)
```env
SESSION_DRIVER=file
```

For **production**: Use `database` driver with the sessions table (Option 1)
```env
SESSION_DRIVER=database
```

## Additional Notes

- If you're using Sanctum for API authentication (which this project does), sessions might not be necessary for API routes
- Make sure your `config/session.php` matches your `.env` settings
- If the issue persists, check your database connection in `.env`


