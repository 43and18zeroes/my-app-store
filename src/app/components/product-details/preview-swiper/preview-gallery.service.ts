// preview-gallery.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PreviewGalleryService {
  private readonly base = '/img/applications/previews';

  constructor(private http: HttpClient) {}

  private clean(path: string) {
    return (path || '').replace(/^\/+/, '');
  }

  galleryUrl(productPreviewsPath: string) {
    const p = this.clean(productPreviewsPath);
    return `${this.base}/${p}/gallery.json`;
  }

  imageUrl(productPreviewsPath: string, file: string) {
    const p = this.clean(productPreviewsPath);
    return `${this.base}/${p}/${file}`;
  }

  loadImages(productPreviewsPath: string) {
    const url = this.galleryUrl(productPreviewsPath);
    return this.http.get<string[]>(url).pipe(
      map((data) => data ?? []),
      catchError((err) => {
        console.error('gallery.json nicht gefunden:', url, err);
        return of([] as string[]);
      })
    );
  }
}
