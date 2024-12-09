import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GamesService {
    private apiUrl = 'http://ec2-35-182-90-158.ca-central-1.compute.amazonaws.com:3000/api' + '/games';

    constructor(private http: HttpClient) {}

    joinGameByAccessCode(accessCode: string): Observable<Game> {
        return this.http.get<Game>(`${this.apiUrl}/join/${accessCode}`);
    }

    createGame(game: Omit<Game, '_id' | 'updatedAt'>): Observable<Game> {
        return this.http.post<Game>(`${this.apiUrl}/create`, game);
    }

    getGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.apiUrl}/getGames`);
    }

    getGameById(gameId: string): Observable<Game> {
        return this.http.get<Game>(`${this.apiUrl}/${gameId}`);
    }

    updateGameDetails(gameId: string, title: string, description: string, board: Tiles[][]): Observable<Game> {
        return this.http.patch<Game>(`${this.apiUrl}/${gameId}/update`, { title, description, board });
    }

    changeBoard(gameId: string, board: Tiles[][]): Observable<Game> {
        return this.http.patch<Game>(`${this.apiUrl}/${gameId}/update`, { board });
    }

    changeVisibility(gameId: string, visibility: boolean): Observable<Game> {
        return this.http.patch<Game>(`${this.apiUrl}/${gameId}/update`, { visibility });
    }

    deleteGame(gameId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${gameId}`);
    }
}
