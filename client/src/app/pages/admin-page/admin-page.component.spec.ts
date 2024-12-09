/* eslint-disable */

import { Location } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router, RouterModule, Routes } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { GameModeComponent } from '@app/components/game-mode/game-mode.component';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ImportExportService } from '@app/services/edit/import-export/import-export.service';

const routes: Routes = [{ path: 'home', component: MainPageComponent }];

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let router: Router;
    let location: Location;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let mockImportExportService: jasmine.SpyObj<ImportExportService>;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        mockImportExportService = jasmine.createSpyObj('ImportExportService', ['importGame']);
        await TestBed.configureTestingModule({
            imports: [RouterModule.forRoot(routes), AdminPageComponent],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: ImportExportService, useValue: mockImportExportService },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router.initialNavigation();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should route to "/home" when clicking on the home button', async () => {
        const button = fixture.debugElement.queryAll(By.css('button'))[0];
        button.nativeElement.click();
        await fixture.whenStable();

        expect(location.path()).toBe('/home');
    });

    it('should open GameModeComponent dialog when clicking "Create a new game"', () => {
        const button = fixture.debugElement.queryAll(By.css('button'))[1];
        button.nativeElement.click();

        expect(dialogSpy.open).toHaveBeenCalledWith(GameModeComponent);
    });

    it('should pass filteredVisibility as false to the GameListComponent', () => {
        const gameListDebugElement = fixture.debugElement.query(By.directive(GameListComponent));
        const gameListComponentInstance = gameListDebugElement.componentInstance as GameListComponent;

        expect(gameListComponentInstance.filteredVisibility).toBeFalse();
    });

    it('should call importGame when handleImport is triggered', () => {
        // Trigger the handleImport method
        component.handleImport();

        // Verify that importGame was called
        expect(mockImportExportService.importGame).toHaveBeenCalled();
    });
});
