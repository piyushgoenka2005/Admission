# ISRO Server Deployment Guide

## 1. Deployment Package

The deployment zip file has been created at:
```
c:\Users\goenk\Desktop\portalll-deployment.zip
```

This zip contains all necessary files excluding:
- `node_modules` (will be installed on server)
- `.next` (build artifacts, will be rebuilt on server)
- `.git` (version control)

## 2. Server Setup Instructions

### Prerequisites on ISRO Server
- Node.js (v18 or higher)
- MongoDB (installed and running)
- npm or yarn

### Deployment Steps

1. **Extract the zip file on the server:**
   ```bash
   unzip portalll-deployment.zip
   cd portalll
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the project root with:
   ```
   MONGODB_URI=mongodb://localhost:27017/portal_db
   # or your MongoDB connection string
   ```

4. **Build the application:**
   ```bash
   npm run build
   ```

5. **Start the application:**
   ```bash
   npm start
   # For development:
   npm run dev
   ```

6. **Configure reverse proxy (nginx example):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 3. Database Migration

### Option A: Using MongoDB Tools (Recommended)

#### Export from Current Database
```bash
# Export all collections
mongodump --uri="mongodb://localhost:27017/portal_db" --out=./mongodb-backup

# Or export specific collections
mongodump --uri="mongodb://localhost:27017/portal_db" --collection=applications --out=./mongodb-backup
mongodump --uri="mongodb://localhost:27017/portal_db" --collection=guides --out=./mongodb-backup
```

#### Transfer to ISRO Server
```bash
# Compress the backup
tar -czf mongodb-backup.tar.gz mongodb-backup

# Transfer using scp
scp mongodb-backup.tar.gz user@isro-server:/path/to/backup/
```

#### Import to ISRO Database
```bash
# On ISRO server, extract
tar -xzf mongodb-backup.tar.gz

# Import to database
mongorestore --uri="mongodb://localhost:27017/portal_db" ./mongodb-backup
```

### Option B: Using Custom Export Script

The project includes a script to export data as JSON:

```bash
# Run the export script
node scripts/export-database.js
```

This will create:
- `exports/applications.json` - All student applications
- `exports/guides.json` - All guide details

#### Import to ISRO Database
```bash
# Transfer the exports folder to ISRO server
# Then run the import script
node scripts/import-database.js
```

### Option C: Using the CSV Import Script

If you have the CSV file (`Data_All_letters_Updated-latest_20Apr26_Major.csv`):

```bash
# On ISRO server, place the CSV in the project root
# Then run:
npm run import-csv
```

This will import all student data from the CSV into the `applications` collection.

## 4. Guide Details Migration

### Export Guide Details

#### Method 1: Using MongoDB Export
```bash
# Export guides collection
mongoexport --uri="mongodb://localhost:27017/portal_db" --collection=guides --out=guides.json --jsonArray
```

#### Method 2: Using API Endpoint
The application has an API endpoint to fetch all guides:
```
GET /api/guides
```

You can call this endpoint (with authentication) to get all guide details in JSON format.

### Import Guide Details to ISRO Database

#### Method 1: Using MongoDB Import
```bash
# Import guides collection
mongoimport --uri="mongodb://localhost:27017/portal_db" --collection=guides --file=guides.json --jsonArray
```

#### Method 2: Using Admin Dashboard
1. Access the Admin Dashboard on the deployed server
2. Navigate to the Guide Library section
3. Use the "Add Guide" feature to manually add guides
4. Or use the bulk import feature if available

#### Method 3: Using API Endpoint
```bash
# Import guides via API (requires authentication)
curl -X POST http://your-server.com/api/guides \
  -H "Content-Type: application/json" \
  -H "Cookie: dashboard_auth=your_auth_cookie" \
  -d '{
    "name": "Guide Name",
    "division": "Division",
    "reportingOfficer": "Reporting Officer",
    "email": "guide@email.com",
    "dd": "DD"
  }'
```

## 5. Verification Steps

After deployment, verify:

1. **Application is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Database connection:**
   - Check that student applications are accessible
   - Check that guide details are accessible

3. **Admin Dashboard:**
   - Login to admin dashboard
   - Verify student applications are visible
   - Verify guide library is populated

4. **Form Submission:**
   - Test a new student application submission
   - Verify it appears in the admin dashboard

## 6. Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env.local`
- Ensure firewall allows MongoDB port (default 27017)

### Build Errors
- Clear cache: `rm -rf .next node_modules`
- Reinstall: `npm install`
- Rebuild: `npm run build`

### Port Already in Use
- Change port in `package.json` or use environment variable `PORT=3001 npm start`

## 7. Security Considerations

1. **Environment Variables:**
   - Never commit `.env.local` to version control
   - Use strong MongoDB credentials
   - Set secure cookie settings in production

2. **MongoDB Security:**
   - Enable authentication in MongoDB
   - Use strong passwords
   - Restrict network access

3. **HTTPS:**
   - Configure SSL certificate for production
   - Use HTTPS for all requests

## 8. Maintenance

### Regular Backups
```bash
# Automated backup script
mongodump --uri="mongodb://localhost:27017/portal_db" --out=/backups/$(date +%Y%m%d)
```

### Log Monitoring
- Monitor application logs for errors
- Check MongoDB logs for performance issues

### Updates
- Pull latest code changes
- Run `npm install` for new dependencies
- Rebuild with `npm run build`
- Restart the application
