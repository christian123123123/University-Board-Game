import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { Module } from '@nestjs/common';

@Module({
    providers: [SharedDataService],
    exports: [SharedDataService],
})
export class SharedModule {}
