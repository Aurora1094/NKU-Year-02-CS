`timescale 1ns/1ps

module tb_div4_u10;

reg  [9:0] x;
wire [7:0] y;

div4_u10 uut (
    .x(x),
    .y(y)
);

initial begin
    x = 10'd0;      // 0
    #10;

    x = 10'd4;      // 1
    #10;

    x = 10'd12;     // 3
    #10;

    x = 10'd100;    // 25
    #10;

    x = 10'd1020;   // 255
    #10;

    $finish;
end

endmodule