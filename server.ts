import express, { Request, Response } from 'express';
import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq, desc, asc } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded assets directly
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Health Check
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const test = await db.select().from(schema.salonConfig).limit(1);
    res.json({
      status: 'ok',
      database: 'cloud_sql_postgres',
      tablesReady: true,
      records: test.length,
    });
  } catch (err: any) {
    console.error('Health check database query error:', err);
    res.status(500).json({ status: 'error', message: 'Database query failed' });
  }
});

// Salon Config
app.get('/api/config', async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(schema.salonConfig)
      .where(eq(schema.salonConfig.id, 'default_salon'))
      .limit(1);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Config not found' });
    }
  } catch (err) {
    console.error('Failed to fetch salon config:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/config', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const cleanId = payload.id || 'default_salon';

    await db
      .insert(schema.salonConfig)
      .values({
        id: cleanId,
        salonName: payload.salonName || payload.name || 'Moreninha do Bronze',
        address: payload.address || 'Rua Aurélia, Mesquita – RJ',
        fullAddress: payload.fullAddress || payload.address || 'Rua Aurélia, Mesquita – RJ, 26553-000',
        shortAddress: payload.shortAddress || payload.address || 'Rua Aurélia, Mesquita – RJ',
        phone: payload.phone || payload.whatsappNumber || '21976333205',
        whatsappNumber: payload.whatsappNumber || payload.phone || '21976333205',
        whatsappDisplay: payload.whatsappDisplay || '(21) 97633-3205',
        instagramHandle: payload.instagramHandle || '@moreninhadobronze01',
        instagramUrl: payload.instagramUrl || 'https://www.instagram.com/moreninhadobronze01',
        mapsUrl: payload.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=Rua+Aur%C3%A9lia%2C+Mesquita+-+RJ',
        coverImageUrl: payload.coverImageUrl || payload.heroCoverImage || './images/banner.png',
        avatarUrl: payload.avatarUrl || payload.avatarImage || './images/avatar.png',
        avatarInitials: payload.avatarInitials || 'MB',
        statusPillText: payload.statusPillText || 'Aberto • Atendimento até 21h',
        servicesSectionTitle: payload.servicesSectionTitle || 'Serviços & Procedimentos',
        servicesSectionSubtitle: payload.servicesSectionSubtitle || '',
        openingHour: payload.openingHour || '09:00',
        closingHour: payload.closingHour || '21:00',
        openingHoursText: payload.openingHoursText || '09:00 às 21:00',
        timeSlots: payload.timeSlots,
        maxSlotsPerTime: payload.maxSlotsPerTime || payload.slotsCapacity || 3,
        pixKey: payload.pixKey || '21976333205',
        pixMerchantName: payload.pixMerchantName || 'Moreninha Bronze',
        pixMerchantCity: payload.pixMerchantCity || payload.pixCity || 'Mesquita',
        enablePixAdvance: payload.enablePixAdvance !== false,
        enableLocalPayment: payload.enableLocalPayment !== false,
        btnTexts: payload.btnTexts || {},
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.salonConfig.id,
        set: {
          salonName: payload.salonName || payload.name || 'Moreninha do Bronze',
          address: payload.address || 'Rua Aurélia, Mesquita – RJ',
          fullAddress: payload.fullAddress || payload.address || 'Rua Aurélia, Mesquita – RJ, 26553-000',
          shortAddress: payload.shortAddress || payload.address || 'Rua Aurélia, Mesquita – RJ',
          phone: payload.phone || payload.whatsappNumber || '21976333205',
          whatsappNumber: payload.whatsappNumber || payload.phone || '21976333205',
          whatsappDisplay: payload.whatsappDisplay || '(21) 97633-3205',
          instagramHandle: payload.instagramHandle || '@moreninhadobronze01',
          instagramUrl: payload.instagramUrl || 'https://www.instagram.com/moreninhadobronze01',
          mapsUrl: payload.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=Rua+Aur%C3%A9lia%2C+Mesquita+-+RJ',
          coverImageUrl: payload.coverImageUrl || payload.heroCoverImage || './images/banner.png',
          avatarUrl: payload.avatarUrl || payload.avatarImage || './images/avatar.png',
          avatarInitials: payload.avatarInitials || 'MB',
          statusPillText: payload.statusPillText || 'Aberto • Atendimento até 21h',
          servicesSectionTitle: payload.servicesSectionTitle || 'Serviços & Procedimentos',
          servicesSectionSubtitle: payload.servicesSectionSubtitle || '',
          openingHour: payload.openingHour || '09:00',
          closingHour: payload.closingHour || '21:00',
          openingHoursText: payload.openingHoursText || '09:00 às 21:00',
          timeSlots: payload.timeSlots,
          maxSlotsPerTime: payload.maxSlotsPerTime || payload.slotsCapacity || 3,
          pixKey: payload.pixKey || '21976333205',
          pixMerchantName: payload.pixMerchantName || 'Moreninha Bronze',
          pixMerchantCity: payload.pixMerchantCity || payload.pixCity || 'Mesquita',
          enablePixAdvance: payload.enablePixAdvance !== false,
          enableLocalPayment: payload.enableLocalPayment !== false,
          btnTexts: payload.btnTexts || {},
          updatedAt: new Date(),
        },
      });

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update salon config:', err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// Services
app.get('/api/services', async (_req: Request, res: Response) => {
  try {
    const list = await db
      .select()
      .from(schema.services)
      .orderBy(asc(schema.services.displayOrder));
    res.json(list);
  } catch (err) {
    console.error('Failed to fetch services:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/services', async (req: Request, res: Response) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    for (let i = 0; i < items.length; i++) {
      const s = items[i];
      await db
        .insert(schema.services)
        .values({
          id: s.id,
          name: s.name,
          price: String(s.price || '0.00'),
          description: s.description || '',
          duration: s.duration || '1h',
          durationMinutes: Number(s.durationMinutes || 60),
          imageUrl: s.imageUrl || s.image || '',
          category: s.category || 'Bronze',
          popular: Boolean(s.popular),
          displayOrder: i,
        })
        .onConflictDoUpdate({
          target: schema.services.id,
          set: {
            name: s.name,
            price: String(s.price || '0.00'),
            description: s.description || '',
            duration: s.duration || '1h',
            durationMinutes: Number(s.durationMinutes || 60),
            imageUrl: s.imageUrl || s.image || '',
            category: s.category || 'Bronze',
            popular: Boolean(s.popular),
            displayOrder: i,
          },
        });
    }

    if (Array.isArray(req.body) && items.length > 0) {
      const incomingIds = items.map((s) => s.id);
      const allCurrent = await db.select({ id: schema.services.id }).from(schema.services);
      for (const cur of allCurrent) {
        if (!incomingIds.includes(cur.id)) {
          await db.delete(schema.services).where(eq(schema.services.id, cur.id));
        }
      }
    }

    res.json({ success: true, count: items.length });
  } catch (err) {
    console.error('Failed to upsert services:', err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

app.delete('/api/services/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.delete(schema.services).where(eq(schema.services.id, id));
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Failed to delete service:', err);
    res.status(500).json({ error: 'Database delete failed' });
  }
});

// Specialists
app.get('/api/specialists', async (_req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.specialists);
    res.json(list);
  } catch (err) {
    console.error('Failed to fetch specialists:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/specialists', async (req: Request, res: Response) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    for (const sp of items) {
      await db
        .insert(schema.specialists)
        .values({
          id: sp.id,
          name: sp.name,
          role: sp.role || 'Especialista em Bronzeamento',
          bio: sp.bio || '',
          imageUrl: sp.imageUrl || sp.avatarUrl || sp.image || '',
        })
        .onConflictDoUpdate({
          target: schema.specialists.id,
          set: {
            name: sp.name,
            role: sp.role || 'Especialista em Bronzeamento',
            bio: sp.bio || '',
            imageUrl: sp.imageUrl || sp.avatarUrl || sp.image || '',
          },
        });
    }
    res.json({ success: true, count: items.length });
  } catch (err) {
    console.error('Failed to upsert specialists:', err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// Appointments
app.get('/api/appointments', async (_req: Request, res: Response) => {
  try {
    const list = await db
      .select()
      .from(schema.appointments)
      .orderBy(desc(schema.appointments.createdAt));
    res.json(list);
  } catch (err) {
    console.error('Failed to fetch appointments:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/appointments', async (req: Request, res: Response) => {
  try {
    const a = req.body;
    await db.insert(schema.appointments).values({
      id: a.id,
      clientName: a.clientName,
      clientPhone: a.clientPhone,
      serviceId: a.serviceId || null,
      serviceName: a.serviceName,
      servicePrice: String(a.servicePrice || '0.00'),
      totalPrice: String(a.totalPrice ?? a.servicePrice ?? '0.00'),
      servicesList: a.servicesList || [],
      specialistId: a.specialistId || null,
      specialistName: a.specialistName || a.specialist || null,
      specialist: a.specialist || a.specialistName || null,
      date: a.date,
      time: a.time,
      paymentMethod: a.paymentMethod || 'pix',
      paymentStatus: a.paymentStatus || 'pendente',
      status: a.status || 'pendente',
      receiptImage: a.receiptImage || null,
      notes: a.notes || '',
      createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
    });
    res.json({ success: true, id: a.id });
  } catch (err) {
    console.error('Failed to create appointment:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

app.patch('/api/appointments/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db
      .update(schema.appointments)
      .set({ status })
      .where(eq(schema.appointments.id, id));
    res.json({ success: true, id, status });
  } catch (err) {
    console.error('Failed to update appointment status:', err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

app.delete('/api/appointments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db
      .delete(schema.appointments)
      .where(eq(schema.appointments.id, id));
    res.json({ success: true, id });
  } catch (err) {
    console.error('Failed to delete appointment:', err);
    res.status(500).json({ error: 'Database delete failed' });
  }
});

// Host salon images directly on Supabase Storage
app.post('/api/supabase/host-images', async (req: Request, res: Response) => {
  try {
    const supabaseUrl = req.body.supabaseUrl || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = req.body.supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: 'Supabase URL and Anon Key are required' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'salon-images';

    try {
      await supabase.storage.createBucket(bucketName, { public: true });
    } catch {
      // Bucket may exist or need SQL creation
    }

    const fs = await import('fs');
    const assets = [
      { key: 'banner', filename: 'banner.png' },
      { key: 'avatar', filename: 'avatar.png' },
      { key: 'serviceHero', filename: 'service-hero.png' },
      { key: 'bannerThumb', filename: 'banner-thumb.png' },
    ];

    const uploadedUrls: Record<string, string> = {};

    for (const asset of assets) {
      const filePath = path.join(__dirname, 'public', 'images', asset.filename);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        await supabase.storage.from(bucketName).upload(asset.filename, fileBuffer, {
          upsert: true,
          contentType: 'image/png',
        });
        const { data } = supabase.storage.from(bucketName).getPublicUrl(asset.filename);
        if (data?.publicUrl) {
          uploadedUrls[asset.key] = data.publicUrl;
        }
      }
    }

    // Update in Cloud SQL database
    if (uploadedUrls.banner || uploadedUrls.avatar) {
      await db
        .update(schema.salonConfig)
        .set({
          ...(uploadedUrls.banner ? { coverImageUrl: uploadedUrls.banner } : {}),
          ...(uploadedUrls.avatar ? { avatarUrl: uploadedUrls.avatar } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.salonConfig.id, 'default_salon'));
    }

    res.json({
      success: true,
      message: 'Imagens enviadas com sucesso para o Supabase Storage!',
      urls: uploadedUrls,
    });
  } catch (err: any) {
    console.error('Failed to host images on Supabase:', err);
    res.status(500).json({ error: err.message || 'Failed to upload images' });
  }
});

// Initialize database tables if not existing (especially useful when deploying to Vercel/Supabase)
async function initTables() {
  try {
    const { createPool } = await import('./src/db/index.ts');
    const pool = createPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS salon_config (
        id TEXT PRIMARY KEY DEFAULT 'default_salon',
        salon_name TEXT NOT NULL DEFAULT 'Moreninha do Bronze',
        address TEXT DEFAULT 'Rua Aurélia, Mesquita – RJ',
        full_address TEXT DEFAULT 'Rua Aurélia, Mesquita – RJ, 26553-000',
        short_address TEXT DEFAULT 'Rua Aurélia, Mesquita – RJ',
        phone TEXT DEFAULT '21976333205',
        whatsapp_number TEXT DEFAULT '21976333205',
        whatsapp_display TEXT DEFAULT '(21) 97633-3205',
        instagram_handle TEXT DEFAULT '@moreninhadobronze',
        instagram_url TEXT DEFAULT 'https://instagram.com/moreninhadobronze',
        maps_url TEXT DEFAULT 'https://www.google.com/maps/search/?api=1&query=Rua+Aur%C3%A9lia%2C+Mesquita+-+RJ',
        cover_image_url TEXT DEFAULT './images/banner.png',
        avatar_url TEXT DEFAULT './images/avatar.png',
        avatar_initials TEXT DEFAULT 'MB',
        status_pill_text TEXT DEFAULT 'Aberto • Atendimento até 21h',
        services_section_title TEXT DEFAULT 'Serviços & Procedimentos',
        services_section_subtitle TEXT DEFAULT 'Escolha seu procedimento preferido e agende seu horário com marquinha de fita.',
        opening_hour TEXT DEFAULT '09:00',
        closing_hour TEXT DEFAULT '21:00',
        opening_hours_text TEXT DEFAULT '09:00 às 21:00',
        time_slots JSONB DEFAULT '["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"]'::jsonb,
        max_slots_per_time INTEGER DEFAULT 3,
        pix_key TEXT DEFAULT '21976333205',
        pix_merchant_name TEXT DEFAULT 'Moreninha Bronze',
        pix_merchant_city TEXT DEFAULT 'Mesquita',
        enable_pix_advance BOOLEAN DEFAULT true,
        enable_local_payment BOOLEAN DEFAULT true,
        btn_texts JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        description TEXT DEFAULT '',
        duration TEXT DEFAULT '1h',
        duration_minutes INTEGER DEFAULT 60,
        image_url TEXT DEFAULT '',
        category TEXT DEFAULT 'Bronze',
        popular BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS specialists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Especialista em Bronzeamento',
        bio TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        client_name TEXT NOT NULL,
        client_phone TEXT NOT NULL,
        service_id TEXT,
        service_name TEXT NOT NULL,
        service_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        total_price NUMERIC(10, 2) DEFAULT 0.00,
        services_list JSONB DEFAULT '[]'::jsonb,
        specialist_id TEXT,
        specialist_name TEXT,
        specialist TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'pix',
        payment_status TEXT DEFAULT 'pendente',
        status TEXT NOT NULL DEFAULT 'pendente',
        receipt_image TEXT,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );
    `);
  } catch (err) {
    console.warn('initTables notice (database might already be initialized):', err);
  }
}

// Upload a single custom image permanently (saves to Supabase Storage, local disk, or database)
app.post('/api/upload-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, filename = 'image.jpg', supabaseUrl, supabaseKey } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Extract raw base64 data
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'image/jpeg';
    const base64Data = matches ? matches[2] : imageBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
    const cleanPrefix = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = `${cleanPrefix}_${Date.now()}${ext}`;

    // 1. If Supabase credentials are provided or configured in env, attempt upload to Supabase Storage
    const targetSupabaseUrl = supabaseUrl || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const targetSupabaseKey = supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (targetSupabaseUrl && targetSupabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(targetSupabaseUrl, targetSupabaseKey);
        const bucketName = 'salon-images';

        // Auto-create bucket if permitted
        try {
          await supabase.storage.createBucket(bucketName, { public: true });
        } catch {
          // Continue if already exists
        }

        const { error: uploadErr } = await supabase.storage.from(bucketName).upload(safeFilename, buffer, {
          upsert: true,
          contentType: mimeType,
        });

        if (!uploadErr) {
          const { data } = supabase.storage.from(bucketName).getPublicUrl(safeFilename);
          if (data?.publicUrl) {
            return res.json({
              success: true,
              url: data.publicUrl,
              source: 'supabase',
            });
          }
        } else {
          console.warn('Supabase Storage upload returned error, using fallback:', uploadErr.message);
        }
      } catch (subErr) {
        console.warn('Falha no upload para Supabase, usando fallback:', subErr);
      }
    }

    // 2. Try writing to local public/uploads directory (if running on a server with writable filesystem)
    let localUrl = '';
    try {
      const fs = await import('fs');
      const uploadsDir = path.join(__dirname, 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const targetPath = path.join(uploadsDir, safeFilename);
      fs.writeFileSync(targetPath, buffer);
      localUrl = `/uploads/${safeFilename}`;
    } catch (fsErr) {
      console.warn('Local filesystem write skipped (serverless/read-only environment):', fsErr);
    }

    // 3. In serverless / Vercel (or when localUrl is not available), return imageBase64
    // Since images are optimized (WebP/JPEG ~30-60KB), storing in PostgreSQL text column
    // guarantees 100% permanence across ANY host without disappearing on rebuilds or git redeploys!
    if (process.env.VERCEL || !localUrl) {
      return res.json({
        success: true,
        url: imageBase64,
        source: 'database_base64',
      });
    }

    res.json({
      success: true,
      url: localUrl,
      source: 'local',
    });
  } catch (err: any) {
    console.error('Failed to upload image:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  await initTables();

  const isProd = process.env.NODE_ENV === 'production';

  // Serve static uploads
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: 3000, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

// Start standalone server only when not executing inside Vercel serverless environment
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
