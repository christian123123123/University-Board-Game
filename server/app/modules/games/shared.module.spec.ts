import { Test } from '@nestjs/testing';
import { SharedModule } from './shared.module';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';

describe('SharedModule', () => {
    let sharedDataService: SharedDataService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [SharedModule],
        }).compile();

        sharedDataService = moduleRef.get<SharedDataService>(SharedDataService);
    });

    it('should provide SharedDataService', () => {
        expect(sharedDataService).toBeDefined();
        expect(sharedDataService).toBeInstanceOf(SharedDataService);
    });

    it('should export SharedDataService', async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [SharedModule],
        }).compile();

        const exportedService = moduleRef.get<SharedDataService>(SharedDataService);
        expect(exportedService).toBeDefined();
        expect(exportedService).toBeInstanceOf(SharedDataService);
    });
});
